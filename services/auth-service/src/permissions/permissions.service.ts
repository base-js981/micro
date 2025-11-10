import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { UpdatePermissionDto } from './dtos/update-permission.dto';
import { PermissionResponseDto } from './dtos/permission-response.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPermissionsByRoles(roleNames: string[]): Promise<string[]> {
    if (!roleNames || roleNames.length === 0) {
      return [];
    }

    const roles = await this.prisma.role.findMany({
      where: {
        name: {
          in: roleNames,
        },
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // Flatten and get unique permissions
    const permissionsSet = new Set<string>();
    roles.forEach((role: any) => {
      role.permissions.forEach((rp: any) => {
        permissionsSet.add(rp.permission.name);
      });
    });

    return Array.from(permissionsSet);
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return [];
    }

    // Flatten and get unique permissions
    const permissionsSet = new Set<string>();
    user.roles.forEach((userRole: any) => {
      userRole.role.permissions.forEach((rp: any) => {
        permissionsSet.add(rp.permission.name);
      });
    });

    return Array.from(permissionsSet);
  }

  async findAll(): Promise<PermissionResponseDto[]> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return permissions.map((p: any) => this.mapToResponseDto(p));
  }

  async findOne(id: string): Promise<PermissionResponseDto> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return this.mapToResponseDto(permission);
  }

  async create(createPermissionDto: CreatePermissionDto): Promise<PermissionResponseDto> {
    // Check if permission already exists
    const existing = await this.prisma.permission.findUnique({
      where: { name: createPermissionDto.name },
    });

    if (existing) {
      throw new ConflictException('Permission with this name already exists');
    }

    // Check if resource+action combination already exists
    const existingResourceAction = await this.prisma.permission.findFirst({
      where: {
        resource: createPermissionDto.resource,
        action: createPermissionDto.action,
      },
    });

    if (existingResourceAction) {
      throw new ConflictException(
        `Permission with resource "${createPermissionDto.resource}" and action "${createPermissionDto.action}" already exists`,
      );
    }

    const permission = await this.prisma.permission.create({
      data: {
        name: createPermissionDto.name,
        resource: createPermissionDto.resource,
        action: createPermissionDto.action,
        description: createPermissionDto.description,
      },
    });

    return this.mapToResponseDto(permission);
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<PermissionResponseDto> {
    const existing = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    // Check if new name conflicts
    if (updatePermissionDto.name && updatePermissionDto.name !== existing.name) {
      const nameExists = await this.prisma.permission.findUnique({
        where: { name: updatePermissionDto.name },
      });

      if (nameExists) {
        throw new ConflictException('Permission with this name already exists');
      }
    }

    // Check if new resource+action combination conflicts
    if (
      (updatePermissionDto.resource || updatePermissionDto.action) &&
      (updatePermissionDto.resource !== existing.resource ||
        updatePermissionDto.action !== existing.action)
    ) {
      const resource = updatePermissionDto.resource || existing.resource;
      const action = updatePermissionDto.action || existing.action;

      const resourceActionExists = await this.prisma.permission.findFirst({
        where: {
          resource,
          action,
          NOT: { id },
        },
      });

      if (resourceActionExists) {
        throw new ConflictException(
          `Permission with resource "${resource}" and action "${action}" already exists`,
        );
      }
    }

    const permission = await this.prisma.permission.update({
      where: { id },
      data: {
        name: updatePermissionDto.name,
        resource: updatePermissionDto.resource,
        action: updatePermissionDto.action,
        description: updatePermissionDto.description,
      },
    });

    return this.mapToResponseDto(permission);
  }

  async remove(id: string): Promise<void> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    await this.prisma.permission.delete({
      where: { id },
    });
  }

  private mapToResponseDto(permission: any): PermissionResponseDto {
    return {
      id: permission.id,
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
      description: permission.description || undefined,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    };
  }
}

