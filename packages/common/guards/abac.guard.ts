import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ABAC_KEY, AbacMetadata } from '../decorators/abac.decorator';
import { UserContext } from '../types/user-context.interface';

/**
 * Interface for ABAC Service
 * This should be implemented in auth-service
 */
export interface IAbacService {
  checkAccess(context: {
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
  }): Promise<boolean>;
}

/**
 * Base ABAC Guard
 * This should be extended in auth-service with actual ABAC Service injection
 */
@Injectable()
export abstract class AbacGuardBase implements CanActivate {
  constructor(protected reflector: Reflector) {}

  protected abstract getAbacService(): IAbacService;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const abacMetadata = this.reflector.getAllAndOverride<AbacMetadata>(ABAC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!abacMetadata) {
      return true; // No ABAC requirement
    }

    const request = context.switchToHttp().getRequest();
    const user: UserContext = request.user;

    if (!user) {
      return false;
    }

    // Get resource ID from route params if specified
    let resourceId: string | undefined;
    if (abacMetadata.resourceIdParam) {
      resourceId = request.params[abacMetadata.resourceIdParam];
    }

    // Build evaluation context
    const evaluationContext = {
      user: {
        id: user.userId,
        email: user.email,
        roles: user.roles,
        attributes: user.attributes || {},
      },
      resource: {
        id: resourceId,
        type: abacMetadata.resource,
        // Resource attributes can be loaded from database if needed
        attributes: {},
      },
      action: abacMetadata.action,
      environment: {
        // Can add environment attributes like time, location, etc.
      },
    };

    return this.getAbacService().checkAccess(evaluationContext);
  }
}

