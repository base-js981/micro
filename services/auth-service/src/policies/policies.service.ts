import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Policy, PolicyRule, PolicyAssignment, Role, User } from '@micro/database';
import { CreatePolicyDto } from './dtos/create-policy.dto';
import { UpdatePolicyDto } from './dtos/update-policy.dto';
import { PolicyResponseDto } from './dtos/policy-response.dto';
import { CreatePolicyRuleDto } from './dtos/create-policy-rule.dto';
import { PolicyRuleResponseDto } from './dtos/policy-rule-response.dto';
import { PolicyAssignmentResponseDto } from './dtos/policy-assignment-response.dto';

@Injectable()
export class PoliciesService {
  constructor(
    @InjectRepository(Policy)
    private readonly policyRepository: Repository<Policy>,
    @InjectRepository(PolicyRule)
    private readonly policyRuleRepository: Repository<PolicyRule>,
    @InjectRepository(PolicyAssignment)
    private readonly policyAssignmentRepository: Repository<PolicyAssignment>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<PolicyResponseDto[]> {
    const policies = await this.policyRepository.find({
      relations: ['rules', 'assignments', 'assignments.role', 'assignments.user'],
      order: {
        createdAt: 'DESC',
      },
    });

    return policies.map((policy) => this.mapToResponseDto(policy));
  }

  async findOne(id: string): Promise<PolicyResponseDto> {
    const policy = await this.policyRepository.findOne({
      where: { id },
      relations: ['rules', 'assignments', 'assignments.role', 'assignments.user'],
    });

    if (!policy) {
      throw new NotFoundException(`Policy with ID ${id} not found`);
    }

    return this.mapToResponseDto(policy);
  }

  async findByName(name: string): Promise<PolicyResponseDto | null> {
    const policy = await this.policyRepository.findOne({
      where: { name },
      relations: ['rules', 'assignments', 'assignments.role', 'assignments.user'],
    });

    if (!policy) {
      return null;
    }

    return this.mapToResponseDto(policy);
  }

  async create(createPolicyDto: CreatePolicyDto): Promise<PolicyResponseDto> {
    // Check if policy already exists
    const existing = await this.policyRepository.findOne({
      where: { name: createPolicyDto.name },
    });

    if (existing) {
      throw new ConflictException('Policy with this name already exists');
    }

    // Create policy with rules using transaction
    return await this.dataSource.transaction(async (manager) => {
      const policy = manager.create(Policy, {
        id: uuidv4(),
        name: createPolicyDto.name,
        description: createPolicyDto.description,
        resource: createPolicyDto.resource,
        action: createPolicyDto.action,
        effect: createPolicyDto.effect || 'allow',
      });

      const savedPolicy = await manager.save(Policy, policy);

      // Create rules if provided
      if (createPolicyDto.rules && createPolicyDto.rules.length > 0) {
        const rules = createPolicyDto.rules.map((rule) =>
          manager.create(PolicyRule, {
            id: uuidv4(),
            policyId: savedPolicy.id,
            attribute: rule.attribute,
            operator: rule.operator,
            value: rule.value,
          }),
        );
        await manager.save(PolicyRule, rules);
      }

      // Reload with relations
      const policyWithRelations = await manager.findOne(Policy, {
        where: { id: savedPolicy.id },
        relations: ['rules', 'assignments', 'assignments.role', 'assignments.user'],
      });

      return this.mapToResponseDto(policyWithRelations!);
    });
  }

  async update(id: string, updatePolicyDto: UpdatePolicyDto): Promise<PolicyResponseDto> {
    const existing = await this.policyRepository.findOne({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Policy with ID ${id} not found`);
    }

    // Check if new name conflicts
    if (updatePolicyDto.name && updatePolicyDto.name !== existing.name) {
      const nameExists = await this.policyRepository.findOne({
        where: { name: updatePolicyDto.name },
      });

      if (nameExists) {
        throw new ConflictException('Policy with this name already exists');
      }
    }

    // Update policy with rules using transaction
    return await this.dataSource.transaction(async (manager) => {
      // Update policy fields
      if (updatePolicyDto.name !== undefined) existing.name = updatePolicyDto.name;
      if (updatePolicyDto.description !== undefined) existing.description = updatePolicyDto.description;
      if (updatePolicyDto.resource !== undefined) existing.resource = updatePolicyDto.resource;
      if (updatePolicyDto.action !== undefined) existing.action = updatePolicyDto.action;
      if (updatePolicyDto.effect !== undefined) existing.effect = updatePolicyDto.effect;

      await manager.save(Policy, existing);

      // Update rules if provided
      if (updatePolicyDto.rules !== undefined) {
        // Delete all existing rules
        await manager.delete(PolicyRule, { policyId: id });

        // Create new rules
        if (updatePolicyDto.rules.length > 0) {
          const rules = updatePolicyDto.rules.map((rule) =>
            manager.create(PolicyRule, {
              id: uuidv4(),
              policyId: id,
              attribute: rule.attribute,
              operator: rule.operator,
              value: rule.value,
            }),
          );
          await manager.save(PolicyRule, rules);
        }
      }

      // Reload with relations
      const policyWithRelations = await manager.findOne(Policy, {
        where: { id },
        relations: ['rules', 'assignments', 'assignments.role', 'assignments.user'],
      });

      return this.mapToResponseDto(policyWithRelations!);
    });
  }

  async remove(id: string): Promise<void> {
    const policy = await this.policyRepository.findOne({
      where: { id },
    });

    if (!policy) {
      throw new NotFoundException(`Policy with ID ${id} not found`);
    }

    await this.policyRepository.remove(policy);
  }

  // Policy Rules Management
  async getPolicyRules(policyId: string): Promise<PolicyRuleResponseDto[]> {
    const policy = await this.policyRepository.findOne({
      where: { id: policyId },
      relations: ['rules'],
    });

    if (!policy) {
      throw new NotFoundException(`Policy with ID ${policyId} not found`);
    }

    return policy.rules.map((rule) => ({
      id: rule.id,
      attribute: rule.attribute,
      operator: rule.operator,
      value: rule.value,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    }));
  }

  async addPolicyRule(
    policyId: string,
    createRuleDto: CreatePolicyRuleDto,
  ): Promise<PolicyRuleResponseDto> {
    const policy = await this.policyRepository.findOne({
      where: { id: policyId },
    });

    if (!policy) {
      throw new NotFoundException(`Policy with ID ${policyId} not found`);
    }

    const rule = this.policyRuleRepository.create({
      id: uuidv4(),
      policyId,
      attribute: createRuleDto.attribute,
      operator: createRuleDto.operator,
      value: createRuleDto.value,
    });

    const savedRule = await this.policyRuleRepository.save(rule);

    return {
      id: savedRule.id,
      attribute: savedRule.attribute,
      operator: savedRule.operator,
      value: savedRule.value,
      createdAt: savedRule.createdAt,
      updatedAt: savedRule.updatedAt,
    };
  }

  async removePolicyRule(policyId: string, ruleId: string): Promise<void> {
    const rule = await this.policyRuleRepository.findOne({
      where: { id: ruleId },
    });

    if (!rule) {
      throw new NotFoundException(`Rule with ID ${ruleId} not found`);
    }

    if (rule.policyId !== policyId) {
      throw new BadRequestException(`Rule ${ruleId} does not belong to policy ${policyId}`);
    }

    await this.policyRuleRepository.remove(rule);
  }

  // Policy Assignments Management
  async getPolicyAssignments(policyId: string): Promise<PolicyAssignmentResponseDto[]> {
    const policy = await this.policyRepository.findOne({
      where: { id: policyId },
      relations: ['assignments', 'assignments.role', 'assignments.user'],
    });

    if (!policy) {
      throw new NotFoundException(`Policy with ID ${policyId} not found`);
    }

    return policy.assignments.map((assignment) => ({
      id: assignment.id,
      policyId: assignment.policyId,
      roleId: assignment.roleId || undefined,
      userId: assignment.userId || undefined,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    }));
  }

  async assignPolicy(
    policyId: string,
    roleId?: string,
    userId?: string,
  ): Promise<PolicyAssignmentResponseDto> {
    // Validate policy exists
    const policy = await this.policyRepository.findOne({
      where: { id: policyId },
    });

    if (!policy) {
      throw new NotFoundException(`Policy with ID ${policyId} not found`);
    }

    // Must assign to either role or user, but not both
    if (!roleId && !userId) {
      throw new BadRequestException('Must specify either roleId or userId');
    }

    if (roleId && userId) {
      throw new BadRequestException('Cannot assign to both role and user');
    }

    // Validate role exists if provided
    if (roleId) {
      const role = await this.roleRepository.findOne({
        where: { id: roleId },
      });

      if (!role) {
        throw new NotFoundException(`Role with ID ${roleId} not found`);
      }

      // Check if already assigned
      const existing = await this.policyAssignmentRepository.findOne({
        where: {
          policyId,
          roleId,
        },
      });

      if (existing) {
        throw new ConflictException('Policy is already assigned to this role');
      }
    }

    // Validate user exists if provided
    if (userId) {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check if already assigned
      const existing = await this.policyAssignmentRepository.findOne({
        where: {
          policyId,
          userId,
        },
      });

      if (existing) {
        throw new ConflictException('Policy is already assigned to this user');
      }
    }

    // Create assignment
    const assignment = this.policyAssignmentRepository.create({
      id: uuidv4(),
      policyId,
      roleId: roleId || undefined,
      userId: userId || undefined,
    });

    const savedAssignment = await this.policyAssignmentRepository.save(assignment);

    return {
      id: savedAssignment.id,
      policyId: savedAssignment.policyId,
      roleId: savedAssignment.roleId || undefined,
      userId: savedAssignment.userId || undefined,
      createdAt: savedAssignment.createdAt,
      updatedAt: savedAssignment.updatedAt,
    };
  }

  async unassignPolicy(policyId: string, roleId?: string, userId?: string): Promise<void> {
    if (!roleId && !userId) {
      throw new BadRequestException('Must specify either roleId or userId');
    }

    if (roleId && userId) {
      throw new BadRequestException('Cannot unassign from both role and user');
    }

    let assignment;
    if (roleId) {
      assignment = await this.policyAssignmentRepository.findOne({
        where: {
          policyId,
          roleId,
        },
      });
    } else {
      assignment = await this.policyAssignmentRepository.findOne({
        where: {
          policyId,
          userId: userId!,
        },
      });
    }

    if (!assignment) {
      throw new NotFoundException('Policy assignment not found');
    }

    await this.policyAssignmentRepository.remove(assignment);
  }

  private mapToResponseDto(policy: Policy): PolicyResponseDto {
    return {
      id: policy.id,
      name: policy.name,
      description: policy.description || undefined,
      resource: policy.resource,
      action: policy.action,
      effect: policy.effect,
      rules: policy.rules?.map((rule) => ({
        id: rule.id,
        attribute: rule.attribute,
        operator: rule.operator,
        value: rule.value,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
      })),
      assignments: policy.assignments?.map((assignment) => ({
        id: assignment.id,
        policyId: assignment.policyId,
        roleId: assignment.roleId || undefined,
        userId: assignment.userId || undefined,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
      })),
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
    };
  }
}

