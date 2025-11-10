import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { RoleResponseDto } from './dtos/role-response.dto';
import { PermissionResponseDto } from '../permissions/dtos/permission-response.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<RoleResponseDto[]> {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return roles.map((role: any) => this.mapToResponseDto(role));
  }

  async findOne(id: string): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return this.mapToResponseDto(role);
  }

  async findByName(name: string): Promise<RoleResponseDto | null> {
    const role = await this.prisma.role.findUnique({
      where: { name },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      return null;
    }

    return this.mapToResponseDto(role);
  }

  async create(createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    // Check if role already exists
    const existing = await this.prisma.role.findUnique({
      where: { name: createRoleDto.name },
    });

    if (existing) {
      throw new ConflictException('Role with this name already exists');
    }

    // Create role
    const role = await this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        description: createRoleDto.description,
      },
    });

    // Assign permissions if provided
    if (createRoleDto.permissionIds && createRoleDto.permissionIds.length > 0) {
      await this.assignPermissions(role.id, createRoleDto.permissionIds);
    }

    // Fetch role with permissions
    return this.findOne(role.id);
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<RoleResponseDto> {
    const existing = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Check if new name conflicts
    if (updateRoleDto.name && updateRoleDto.name !== existing.name) {
      const nameExists = await this.prisma.role.findUnique({
        where: { name: updateRoleDto.name },
      });

      if (nameExists) {
        throw new ConflictException('Role with this name already exists');
      }
    }

    // Update role
    await this.prisma.role.update({
      where: { id },
      data: {
        name: updateRoleDto.name,
        description: updateRoleDto.description,
      },
    });

    // Update permissions if provided
    if (updateRoleDto.permissionIds !== undefined) {
      // Remove all existing permissions
      await this.prisma.rolePermission.deleteMany({
        where: { roleId: id },
      });

      // Assign new permissions
      if (updateRoleDto.permissionIds.length > 0) {
        await this.assignPermissions(id, updateRoleDto.permissionIds);
      }
    }

    // Fetch updated role with permissions
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    await this.prisma.role.delete({
      where: { id },
    });
  }

  async getRolePermissions(roleId: string): Promise<PermissionResponseDto[]> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    return role.permissions.map((rp: any) => ({
      id: rp.permission.id,
      name: rp.permission.name,
      resource: rp.permission.resource,
      action: rp.permission.action,
      description: rp.permission.description || undefined,
      createdAt: rp.permission.createdAt,
      updatedAt: rp.permission.updatedAt,
    }));
  }

  async assignPermission(roleId: string, permissionId: string): Promise<void> {
    // Check if role exists
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Check if permission exists
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${permissionId} not found`);
    }

    // Check if already assigned
    const existing = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    if (existing) {
      return; // Already assigned, no error
    }

    // Assign permission
    await this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });
  }

  async removePermission(roleId: string, permissionId: string): Promise<void> {
    const rolePermission = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    if (!rolePermission) {
      throw new NotFoundException(
        `Permission ${permissionId} is not assigned to role ${roleId}`,
      );
    }

    await this.prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });
  }

  private async assignPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    // Validate all permissions exist
    const permissions = await this.prisma.permission.findMany({
      where: {
        id: {
          in: permissionIds,
        },
      },
    });

    if (permissions.length !== permissionIds.length) {
      throw new NotFoundException('One or more permissions not found');
    }

    // Assign permissions (skip if already exists)
    await Promise.all(
      permissionIds.map(async (permissionId) => {
        try {
          await this.prisma.rolePermission.create({
            data: {
              roleId,
              permissionId,
            },
          });
        } catch {
          // Already exists, skip
        }
      }),
    );
  }

  private mapToResponseDto(role: any): RoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      description: role.description || undefined,
      permissions: role.permissions?.map((rp: any) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        resource: rp.permission.resource,
        action: rp.permission.action,
        description: rp.permission.description || undefined,
        createdAt: rp.permission.createdAt,
        updatedAt: rp.permission.updatedAt,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}

