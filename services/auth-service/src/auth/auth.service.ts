import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { scryptSync, timingSafeEqual } from 'crypto';
import { User } from '@micro/database';
import { TokensService } from '../tokens/tokens.service';
import { PermissionsService } from '../permissions/permissions.service';
import { LoginDto } from './dtos/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly tokensService: TokensService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken?: string }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
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

  private async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email, deletedAt: IsNull() },
      relations: ['roles', 'roles.role'],
    });

    if (!user) {
      return null;
    }

    const [salt, storedHash] = user.password.split(':');
    const derivedKey = scryptSync(password, salt, 64);
    const isPasswordValid = timingSafeEqual(Buffer.from(storedHash, 'hex'), derivedKey);

    if (!isPasswordValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles?.map((ur) => ur.role?.name || '') || [],
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

