import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContext } from '../types/user-context.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserContext | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.user || null;
  },
);

