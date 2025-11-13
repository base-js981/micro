import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Policy, PolicyRule, PolicyAssignment, User, UserRole } from '@micro/database';
import { IAbacService } from '@micro/common';

export interface PolicyEvaluationContext {
  user: {
    id: string;
    email: string;
    roles: string[];
    attributes: Record<string, string>;
  };
  resource?: {
    id?: string;
    type: string;
    attributes?: Record<string, string>;
  };
  action: string;
  environment?: Record<string, string>;
}

@Injectable()
export class AbacService implements IAbacService {
  constructor(
    @InjectRepository(Policy)
    private readonly policyRepository: Repository<Policy>,
    @InjectRepository(PolicyAssignment)
    private readonly policyAssignmentRepository: Repository<PolicyAssignment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Evaluate a single policy rule
   */
  private evaluateRule(
    rule: { attribute: string; operator: string; value: string },
    context: PolicyEvaluationContext,
  ): boolean {
    const { attribute, operator, value } = rule;

    // Parse attribute path (e.g., "user.department" -> ["user", "department"])
    const [entity, ...pathParts] = attribute.split('.');
    const attributeKey = pathParts.join('.');

    // Get attribute value from context
    let attributeValue: string | undefined;
    if (entity === 'user') {
      attributeValue = context.user.attributes[attributeKey];
    } else if (entity === 'resource' && context.resource) {
      attributeValue = context.resource.attributes?.[attributeKey];
    } else if (entity === 'environment' && context.environment) {
      attributeValue = context.environment[attributeKey];
    }

    if (attributeValue === undefined) {
      return false;
    }

    // Evaluate based on operator
    switch (operator) {
      case 'equals':
        return attributeValue === value;
      case 'notEquals':
        return attributeValue !== value;
      case 'in': {
        try {
          const values = JSON.parse(value) as string[];
          return values.includes(attributeValue);
        } catch {
          return false;
        }
      }
      case 'notIn': {
        try {
          const values = JSON.parse(value) as string[];
          return !values.includes(attributeValue);
        } catch {
          return false;
        }
      }
      case 'contains':
        return attributeValue.includes(value);
      case 'greaterThan': {
        const numValue = parseFloat(attributeValue);
        const numTarget = parseFloat(value);
        return !isNaN(numValue) && !isNaN(numTarget) && numValue > numTarget;
      }
      case 'lessThan': {
        const numValue = parseFloat(attributeValue);
        const numTarget = parseFloat(value);
        return !isNaN(numValue) && !isNaN(numTarget) && numValue < numTarget;
      }
      default:
        return false;
    }
  }

  /**
   * Evaluate a policy (all rules must pass - AND logic)
   */
  private async evaluatePolicy(
    policyId: string,
    context: PolicyEvaluationContext,
  ): Promise<boolean> {
    const policy = await this.policyRepository.findOne({
      where: { id: policyId },
      relations: ['rules'],
    });

    if (!policy) {
      return false;
    }

    // Check if policy matches resource and action
    if (policy.resource !== context.resource?.type || policy.action !== context.action) {
      return false;
    }

    // All rules must pass (AND logic)
    if (policy.rules.length === 0) {
      return true; // Policy with no rules allows access
    }

    return policy.rules.every((rule) => this.evaluateRule(rule, context));
  }

  /**
   * Check if user has access based on ABAC policies
   * Returns true if at least one policy allows access (OR logic between policies)
   */
  async checkAccess(context: PolicyEvaluationContext): Promise<boolean> {
    // Get all policies assigned to user's roles or directly to user
    const user = await this.userRepository.findOne({
      where: { id: context.user.id },
      relations: ['roles', 'roles.role', 'policyAssignments', 'policyAssignments.policy', 'policyAssignments.policy.rules'],
    });

    if (!user) {
      return false;
    }

    // Get role IDs
    const roleIds = user.roles.map((ur) => ur.roleId);

    // Get policies assigned to roles
    const rolePolicyAssignments = await this.policyAssignmentRepository.find({
      where: {
        roleId: In(roleIds),
      },
      relations: ['policy', 'policy.rules'],
    });

    // Combine user-assigned and role-assigned policies
    const allPolicies = [
      ...(user.policyAssignments?.map((pa) => pa.policy) || []),
      ...rolePolicyAssignments.map((pa) => pa.policy),
    ];

    // Remove duplicates
    const uniquePolicies = Array.from(
      new Map(allPolicies.map((p) => [p.id, p])).values(),
    );

    // Check deny policies first (they take precedence)
    for (const policy of uniquePolicies) {
      if (policy.effect === 'deny') {
        const denyResult = await this.evaluatePolicy(policy.id, context);
        if (denyResult) {
          return false;
        }
      }
    }

    // Check allow policies
    for (const policy of uniquePolicies) {
      if (policy.effect === 'allow') {
        const allowResult = await this.evaluatePolicy(policy.id, context);
        if (allowResult) {
          return true;
        }
      }
    }

    return false;
  }
}

