import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable } from 'rxjs';
import { UserAttribute } from '@micro/database';
import { UserContext } from '@micro/common';

/**
 * Interceptor to load user attributes from database and add to request.user
 * This should be used after GatewayUserGuard
 */
@Injectable()
export class AbacInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(UserAttribute)
    private readonly userAttributeRepository: Repository<UserAttribute>,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user: UserContext = request.user;

    if (user && user.userId) {
      // Load user attributes from database
      const userAttributes = await this.userAttributeRepository.find({
        where: { userId: user.userId },
      });

      // Convert to Record<string, string>
      const attributes: Record<string, string> = {};
      userAttributes.forEach((attr) => {
        attributes[attr.key] = attr.value;
      });

      // Add attributes to user context
      user.attributes = attributes;
    }

    return next.handle();
  }
}

