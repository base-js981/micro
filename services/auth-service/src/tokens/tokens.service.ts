import { Injectable } from '@nestjs/common';
import { JwtService } from './jwt.service';

@Injectable()
export class TokensService {
  constructor(private readonly jwtService: JwtService) {}

  async generateAccessToken(user: any): Promise<string> {
    // Extract role names from user roles (only roles, no permissions)
    const roleNames = user.roles?.map((r: any) => (typeof r === 'string' ? r : r.role?.name || r.name)) || [];
    
    const payload = {
      userId: user.id,
      email: user.email,
      roles: roleNames, // Only role names, no permissions
    };
    return this.jwtService.sign(payload);
  }

  async generateRefreshToken(user: any): Promise<string> {
    const payload = {
      userId: user.id,
      type: 'refresh',
    };
    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }

  async validateRefreshToken(token: string): Promise<any> {
    // TODO: Implement refresh token validation
    return null;
  }
}

