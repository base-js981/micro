import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { MessageContext } from '../types/message-context.interface';

@Injectable()
export class MessageUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const data = context.switchToRpc().getData();
    
    if (!data || !data.userContext) {
      return false;
    }

    const userContext: MessageContext = data.userContext;
    
    if (!userContext.userId) {
      return false;
    }

    // Attach user context to request-like object
    context.switchToHttp().getRequest().user = userContext;
    
    return true;
  }
}

