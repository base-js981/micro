import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';

@Injectable()
export class JwtService {
  constructor(
    private readonly configService: ConfigService,
    private readonly nestJwtService: NestJwtService,
  ) {}

  sign(payload: any, options?: { expiresIn?: string }): string {
    const secret = this.configService.get<string>('JWT_SECRET');
    const expiresIn = options?.expiresIn || this.configService.get<string>('JWT_EXPIRES_IN', '15m');
    
    return this.nestJwtService.sign(payload, {
      secret,
      expiresIn,
    });
  }

  verify(token: string): any {
    const secret = this.configService.get<string>('JWT_SECRET');
    try {
      return this.nestJwtService.verify(token, { secret });
    } catch {
      return null;
    }
  }
}

