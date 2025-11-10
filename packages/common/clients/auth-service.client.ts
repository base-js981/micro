import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthServiceClient {
  constructor(
    @Inject('AUTH_SERVICE') private readonly client: ClientProxy,
  ) {}

  async validateToken(token: string): Promise<any> {
    return firstValueFrom(
      this.client.send('validate_token', { token }),
    );
  }

  async getUserInfo(userId: string): Promise<any> {
    return firstValueFrom(
      this.client.send('get_user_info', { userId }),
    );
  }
}

