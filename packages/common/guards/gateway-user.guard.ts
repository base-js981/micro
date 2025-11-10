import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserContext } from '../types/user-context.interface';
import { GatewayHeaders } from '../types/gateway-headers.interface';

@Injectable()
export class GatewayUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const headers = request.headers as GatewayHeaders;

    const userId = headers['x-user-id'];
    const email = headers['x-user-email'];
    const roles = headers['x-user-roles']?.split(',') || [];
    const scopes = headers['x-user-scopes']?.split(',') || [];

    if (!userId || !email) {
      return false;
    }

    const user: UserContext = {
      userId,
      email,
      roles,
      scopes,
    };

    request.user = user;
    return true;
  }
}

