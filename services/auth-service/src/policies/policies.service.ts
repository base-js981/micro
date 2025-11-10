import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePolicyDto } from './dtos/create-policy.dto';
import { UpdatePolicyDto } from './dtos/update-policy.dto';
import { PolicyResponseDto } from './dtos/policy-response.dto';
import { CreatePolicyRuleDto } from './dtos/create-policy-rule.dto';
import { PolicyRuleResponseDto } from './dtos/policy-rule-response.dto';
import { PolicyAssignmentResponseDto } from './dtos/policy-assignment-response.dto';

@Injectable()
export class PoliciesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<PolicyResponseDto[]> {
    const policies = await this.prisma.policy.findMany({
      include: {
        rules: true,
        assignments: {
          include: {
            role: true,
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return policies.map((policy) => this.mapToResponseDto(policy));
  }

  async findOne(id: string): Promise<PolicyResponseDto> {
    const policy = await this.prisma.policy.findUnique({
      where: { id },
      include: {
        rules: true,
        assignments: {
          include: {
            role: true,
            user: true,
          },
        },
      },
    });

    if (!policy) {
      throw new NotFoundException(`Policy with ID ${id} not found`);
    }

    return this.mapToResponseDto(policy);
  }

  async findByName(name: string): Promise<PolicyResponseDto | null> {
    const policy = await this.prisma.policy.findUnique({
      where: { name },
      include: {
        rules: true,
        assignments: {
          include: {
            role: true,
            user: true,
          },
        },
      },
    });

    if (!policy) {
      return null;
    }

    return this.mapToResponseDto(policy);
  }

  async create(createPolicyDto: CreatePolicyDto): Promise<PolicyResponseDto> {
    // Check if policy already exists
    const existing = await this.prisma.policy.findUnique({
      where: { name: createPolicyDto.name },
    });

    if (existing) {
      throw new ConflictException('Policy with this name already exists');
    }

    // Create policy with rules
    const policy = await this.prisma.policy.create({
      data: {
        name: createPolicyDto.name,
        description: createPolicyDto.description,
        resource: createPolicyDto.resource,
        action: createPolicyDto.action,
        effect: createPolicyDto.effect || 'allow',
        rules: createPolicyDto.rules
          ? {
              create: createPolicyDto.rules.map((rule) => ({
                attribute: rule.attribute,
                operator: rule.operator,
                value: rule.value,
              })),
            }
          : undefined,
      },
      include: {
        rules: true,
        assignments: {
          include: {
            role: true,
            user: true,
          },
        },
      },
    });

    return this.mapToResponseDto(policy);
  }

  async update(id: string, updatePolicyDto: UpdatePolicyDto): Promise<PolicyResponseDto> {
    const existing = await this.prisma.policy.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Policy with ID ${id} not found`);
    }

    // Check if new name conflicts
    if (updatePolicyDto.name && updatePolicyDto.name !== existing.name) {
      const nameExists = await this.prisma.policy.findUnique({
        where: { name: updatePolicyDto.name },
      });

      if (nameExists) {
        throw new ConflictException('Policy with this name already exists');
      }
    }

    // Update policy
    const updateData: any = {};
    if (updatePolicyDto.name !== undefined) updateData.name = updatePolicyDto.name;
    if (updatePolicyDto.description !== undefined) updateData.description = updatePolicyDto.description;
    if (updatePolicyDto.resource !== undefined) updateData.resource = updatePolicyDto.resource;
    if (updatePolicyDto.action !== undefined) updateData.action = updatePolicyDto.action;
    if (updatePolicyDto.effect !== undefined) updateData.effect = updatePolicyDto.effect;

    // Update rules if provided
    if (updatePolicyDto.rules !== undefined) {
      // Delete all existing rules
      await this.prisma.policyRule.deleteMany({
        where: { policyId: id },
      });

      // Create new rules
      if (updatePolicyDto.rules.length > 0) {
        updateData.rules = {
          create: updatePolicyDto.rules.map((rule) => ({
            attribute: rule.attribute,
            operator: rule.operator,
            value: rule.value,
          })),
        };
      }
    }

    const policy = await this.prisma.policy.update({
      where: { id },
      data: updateData,
      include: {
        rules: true,
        assignments: {
          include: {
            role: true,
            user: true,
          },
        },
      },
    });

    return this.mapToResponseDto(policy);
  }

  async remove(id: string): Promise<void> {
    const policy = await this.prisma.policy.findUnique({
      where: { id },
    });

    if (!policy) {
      throw new NotFoundException(`Policy with ID ${id} not found`);
    }

    await this.prisma.policy.delete({
      where: { id },
    });
  }

  // Policy Rules Management
  async getPolicyRules(policyId: string): Promise<PolicyRuleResponseDto[]> {
    const policy = await this.prisma.policy.findUnique({
      where: { id: policyId },
      include: { rules: true },
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
    const policy = await this.prisma.policy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      throw new NotFoundException(`Policy with ID ${policyId} not found`);
    }

    const rule = await this.prisma.policyRule.create({
      data: {
        policyId,
        attribute: createRuleDto.attribute,
        operator: createRuleDto.operator,
        value: createRuleDto.value,
      },
    });

    return {
      id: rule.id,
      attribute: rule.attribute,
      operator: rule.operator,
      value: rule.value,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    };
  }

  async removePolicyRule(policyId: string, ruleId: string): Promise<void> {
    const rule = await this.prisma.policyRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule) {
      throw new NotFoundException(`Rule with ID ${ruleId} not found`);
    }

    if (rule.policyId !== policyId) {
      throw new BadRequestException(`Rule ${ruleId} does not belong to policy ${policyId}`);
    }

    await this.prisma.policyRule.delete({
      where: { id: ruleId },
    });
  }

  // Policy Assignments Management
  async getPolicyAssignments(policyId: string): Promise<PolicyAssignmentResponseDto[]> {
    const policy = await this.prisma.policy.findUnique({
      where: { id: policyId },
      include: {
        assignments: {
          include: {
            role: true,
            user: true,
          },
        },
      },
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
    const policy = await this.prisma.policy.findUnique({
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
      const role = await this.prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        throw new NotFoundException(`Role with ID ${roleId} not found`);
      }

      // Check if already assigned
      const existing = await this.prisma.policyAssignment.findUnique({
        where: {
          policyId_roleId: {
            policyId,
            roleId,
          },
        },
      });

      if (existing) {
        throw new ConflictException('Policy is already assigned to this role');
      }
    }

    // Validate user exists if provided
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check if already assigned
      const existing = await this.prisma.policyAssignment.findUnique({
        where: {
          policyId_userId: {
            policyId,
            userId,
          },
        },
      });

      if (existing) {
        throw new ConflictException('Policy is already assigned to this user');
      }
    }

    // Create assignment
    const assignment = await this.prisma.policyAssignment.create({
      data: {
        policyId,
        roleId: roleId || undefined,
        userId: userId || undefined,
      },
    });

    return {
      id: assignment.id,
      policyId: assignment.policyId,
      roleId: assignment.roleId || undefined,
      userId: assignment.userId || undefined,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
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
      assignment = await this.prisma.policyAssignment.findUnique({
        where: {
          policyId_roleId: {
            policyId,
            roleId,
          },
        },
      });
    } else {
      assignment = await this.prisma.policyAssignment.findUnique({
        where: {
          policyId_userId: {
            policyId,
            userId: userId!,
          },
        },
      });
    }

    if (!assignment) {
      throw new NotFoundException('Policy assignment not found');
    }

    await this.prisma.policyAssignment.delete({
      where: { id: assignment.id },
    });
  }

  private mapToResponseDto(policy: any): PolicyResponseDto {
    return {
      id: policy.id,
      name: policy.name,
      description: policy.description || undefined,
      resource: policy.resource,
      action: policy.action,
      effect: policy.effect,
      rules: policy.rules?.map((rule: any) => ({
        id: rule.id,
        attribute: rule.attribute,
        operator: rule.operator,
        value: rule.value,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
      })),
      assignments: policy.assignments?.map((assignment: any) => ({
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

