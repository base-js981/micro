import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserResponseDto } from './dtos/user-response.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password using Node.js crypto (scrypt)
    const salt = randomBytes(16).toString('hex');
    const derivedKey = scryptSync(createUserDto.password, salt, 64).toString('hex');
    const hashedPassword = `${salt}:${derivedKey}`;

    // Get or create roles
    const roleNames = createUserDto.roles || ['user'];
    const roles = await Promise.all(
      roleNames.map(async (roleName) => {
        let role = await this.prisma.role.findUnique({ where: { name: roleName } });
        if (!role) {
          role = await this.prisma.role.create({
            data: { name: roleName, description: `Role: ${roleName}` },
          });
        }
        return role;
      }),
    );

    // Create user with roles
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        name: createUserDto.name,
        roles: {
          create: roles.map((role: any) => ({
            roleId: role.id,
          })),
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return this.mapToResponseDto(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user: any) => this.mapToResponseDto(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.mapToResponseDto(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!existingUser || existingUser.deletedAt) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check if email is being updated and already exists
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (emailExists) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (updateUserDto.email) {
      updateData.email = updateUserDto.email;
    }

    if (updateUserDto.name !== undefined) {
      updateData.name = updateUserDto.name;
    }

    if (updateUserDto.password) {
      const salt = randomBytes(16).toString('hex');
      const derivedKey = scryptSync(updateUserDto.password, salt, 64).toString('hex');
      updateData.password = `${salt}:${derivedKey}`;
    }

    // Update user
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Update roles if provided
    if (updateUserDto.roles) {
      // Get or create roles
      const roleNames = updateUserDto.roles;
      const roles = await Promise.all(
        roleNames.map(async (roleName) => {
          let role = await this.prisma.role.findUnique({ where: { name: roleName } });
          if (!role) {
            role = await this.prisma.role.create({
              data: { name: roleName, description: `Role: ${roleName}` },
            });
          }
          return role;
        }),
      );

      // Delete existing roles
      await this.prisma.userRole.deleteMany({
        where: { userId: id },
      });

      // Create new roles
      await this.prisma.userRole.createMany({
        data: roles.map((role: any) => ({
          userId: id,
          roleId: role.id,
        })),
      });

      // Fetch updated user with roles
      const updatedUser = await this.prisma.user.findUnique({
        where: { id },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      return this.mapToResponseDto(updatedUser!);
    }

    return this.mapToResponseDto(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Soft delete
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      return null;
    }

    const [salt, storedHash] = user.password.split(':');
    const derivedKey = scryptSync(password, salt, 64);
    const isPasswordValid = timingSafeEqual(Buffer.from(storedHash, 'hex'), derivedKey);

    if (!isPasswordValid) {
      return null;
    }

    return this.mapToResponseDto(user);
  }

  async findByEmail(email: string): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      return null;
    }

    return this.mapToResponseDto(user);
  }

  async findById(id: string): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      return null;
    }

    return this.mapToResponseDto(user);
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user.roles.map((ur: any) => ur.role.name);
  }

  async assignRole(userId: string, roleId: string): Promise<UserResponseDto> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if role exists
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Check if already assigned
    const existing = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (existing) {
      // Already assigned, return user
      return this.findOne(userId);
    }

    // Assign role
    await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });

    // Return updated user
    return this.findOne(userId);
  }

  async removeRole(userId: string, roleId: string): Promise<UserResponseDto> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if role assignment exists
    const userRole = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (!userRole) {
      throw new NotFoundException(
        `Role ${roleId} is not assigned to user ${userId}`,
      );
    }

    // Remove role
    await this.prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    // Return updated user
    return this.findOne(userId);
  }

  private mapToResponseDto(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      roles: user.roles?.map((ur: any) => (ur.role?.name || ur.role || ur)) || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

