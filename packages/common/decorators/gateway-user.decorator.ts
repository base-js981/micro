import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContext } from '../types/user-context.interface';

export const GatewayUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserContext | null => {
    const request = ctx.switchToHttp().getRequest();
    const headers = request.headers;

    const userId = headers['x-user-id'];
    const email = headers['x-user-email'];
    const roles = headers['x-user-roles']?.split(',') || [];
    const scopes = headers['x-user-scopes']?.split(',') || [];

    if (!userId || !email) {
      return null;
    }

    return {
      userId,
      email,
      roles,
      scopes,
    };
  },
);

