import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TokensService } from '../tokens/tokens.service';
import { PermissionsService } from '../permissions/permissions.service';
import { LoginDto } from './dtos/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken?: string }> {
    const user = await this.usersService.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.tokensService.generateAccessToken(user);
    const refreshToken = await this.tokensService.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const user = await this.tokensService.validateRefreshToken(refreshToken);
    
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const accessToken = await this.tokensService.generateAccessToken(user);

    return {
      accessToken,
    };
  }

  async getPermissions(roleNames: string[]): Promise<{ permissions: string[]; roles: string[] }> {
    const permissions = await this.permissionsService.getPermissionsByRoles(roleNames);
    return {
      permissions,
      roles: roleNames,
    };
  }
}

