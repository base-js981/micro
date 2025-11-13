import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Role, Permission, RolePermission } from '@micro/database';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { RoleResponseDto } from './dtos/role-response.dto';
import { PermissionResponseDto } from '../permissions/dtos/permission-response.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<RoleResponseDto[]> {
    const roles = await this.roleRepository.find({
      relations: ['permissions', 'permissions.permission'],
      order: {
        createdAt: 'DESC',
      },
    });

    return roles.map((role) => this.mapToResponseDto(role));
  }

  async findOne(id: string): Promise<RoleResponseDto> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions', 'permissions.permission'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return this.mapToResponseDto(role);
  }

  async findByName(name: string): Promise<RoleResponseDto | null> {
    const role = await this.roleRepository.findOne({
      where: { name },
      relations: ['permissions', 'permissions.permission'],
    });

    if (!role) {
      return null;
    }

    return this.mapToResponseDto(role);
  }

  async create(createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    // Check if role already exists
    const existing = await this.roleRepository.findOne({
      where: { name: createRoleDto.name },
    });

    if (existing) {
      throw new ConflictException('Role with this name already exists');
    }

    // Create role
    const role = this.roleRepository.create({
      id: uuidv4(),
      name: createRoleDto.name,
      description: createRoleDto.description,
    });
    const savedRole = await this.roleRepository.save(role);

    // Assign permissions if provided
    if (createRoleDto.permissionIds && createRoleDto.permissionIds.length > 0) {
      await this.assignPermissions(savedRole.id, createRoleDto.permissionIds);
    }

    // Fetch role with permissions
    return this.findOne(savedRole.id);
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<RoleResponseDto> {
    const existing = await this.roleRepository.findOne({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Check if new name conflicts
    if (updateRoleDto.name && updateRoleDto.name !== existing.name) {
      const nameExists = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name },
      });

      if (nameExists) {
        throw new ConflictException('Role with this name already exists');
      }
    }

    // Update role
    await this.roleRepository.update(
      { id },
      {
        name: updateRoleDto.name,
        description: updateRoleDto.description,
      },
    );

    // Update permissions if provided
    if (updateRoleDto.permissionIds !== undefined) {
      // Remove all existing permissions
      await this.rolePermissionRepository.delete({ roleId: id });

      // Assign new permissions
      if (updateRoleDto.permissionIds.length > 0) {
        await this.assignPermissions(id, updateRoleDto.permissionIds);
      }
    }

    // Fetch updated role with permissions
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    await this.roleRepository.delete({ id });
  }

  async getRolePermissions(roleId: string): Promise<PermissionResponseDto[]> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions', 'permissions.permission'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    return role.permissions.map((rp) => ({
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
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Check if permission exists
    const permission = await this.permissionRepository.findOne({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${permissionId} not found`);
    }

    // Check if already assigned
    const existing = await this.rolePermissionRepository.findOne({
      where: {
        roleId,
        permissionId,
      },
    });

    if (existing) {
      return; // Already assigned, no error
    }

    // Assign permission
    const rolePermission = this.rolePermissionRepository.create({
      id: uuidv4(),
      roleId,
      permissionId,
    });
    await this.rolePermissionRepository.save(rolePermission);
  }

  async removePermission(roleId: string, permissionId: string): Promise<void> {
    const rolePermission = await this.rolePermissionRepository.findOne({
      where: {
        roleId,
        permissionId,
      },
    });

    if (!rolePermission) {
      throw new NotFoundException(
        `Permission ${permissionId} is not assigned to role ${roleId}`,
      );
    }

    await this.rolePermissionRepository.delete({
      roleId,
      permissionId,
    });
  }

  private async assignPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    // Validate all permissions exist
    const permissions = await this.permissionRepository.find({
      where: {
        id: In(permissionIds),
      },
    });

    if (permissions.length !== permissionIds.length) {
      throw new NotFoundException('One or more permissions not found');
    }

    // Assign permissions (skip if already exists)
    await Promise.all(
      permissionIds.map(async (permissionId) => {
        const existing = await this.rolePermissionRepository.findOne({
          where: { roleId, permissionId },
        });
        if (!existing) {
          const rolePermission = this.rolePermissionRepository.create({
            id: uuidv4(),
            roleId,
            permissionId,
          });
          await this.rolePermissionRepository.save(rolePermission);
        }
      }),
    );
  }

  private mapToResponseDto(role: Role): RoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      description: role.description || undefined,
      permissions: role.permissions?.map((rp) => ({
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
