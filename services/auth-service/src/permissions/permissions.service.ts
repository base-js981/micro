import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Permission, Role, UserRole, RolePermission } from '@micro/database';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { UpdatePermissionDto } from './dtos/update-permission.dto';
import { PermissionResponseDto } from './dtos/permission-response.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async getPermissionsByRoles(roleNames: string[]): Promise<string[]> {
    if (!roleNames || roleNames.length === 0) {
      return [];
    }

    const roles = await this.roleRepository.find({
      where: {
        name: In(roleNames),
      },
      relations: ['permissions', 'permissions.permission'],
    });

    // Flatten and get unique permissions
    const permissionsSet = new Set<string>();
    roles.forEach((role) => {
      role.permissions.forEach((rp) => {
        permissionsSet.add(rp.permission.name);
      });
    });

    return Array.from(permissionsSet);
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ['role', 'role.permissions', 'role.permissions.permission'],
    });

    if (!userRoles || userRoles.length === 0) {
      return [];
    }

    // Flatten and get unique permissions
    const permissionsSet = new Set<string>();
    userRoles.forEach((userRole) => {
      userRole.role.permissions.forEach((rp) => {
        permissionsSet.add(rp.permission.name);
      });
    });

    return Array.from(permissionsSet);
  }

  async findAll(): Promise<PermissionResponseDto[]> {
    const permissions = await this.permissionRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    return permissions.map((p) => this.mapToResponseDto(p));
  }

  async findOne(id: string): Promise<PermissionResponseDto> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return this.mapToResponseDto(permission);
  }

  async create(createPermissionDto: CreatePermissionDto): Promise<PermissionResponseDto> {
    // Check if permission already exists
    const existing = await this.permissionRepository.findOne({
      where: { name: createPermissionDto.name },
    });

    if (existing) {
      throw new ConflictException('Permission with this name already exists');
    }

    // Check if resource+action combination already exists
    const existingResourceAction = await this.permissionRepository.findOne({
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

    const permission = this.permissionRepository.create({
      id: uuidv4(),
      name: createPermissionDto.name,
      resource: createPermissionDto.resource,
      action: createPermissionDto.action,
      description: createPermissionDto.description,
    });
    const savedPermission = await this.permissionRepository.save(permission);

    return this.mapToResponseDto(savedPermission);
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<PermissionResponseDto> {
    const existing = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    // Check if new name conflicts
    if (updatePermissionDto.name && updatePermissionDto.name !== existing.name) {
      const nameExists = await this.permissionRepository.findOne({
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

      const resourceActionExists = await this.permissionRepository.findOne({
        where: {
          resource,
          action,
        },
      });

      if (resourceActionExists && resourceActionExists.id !== id) {
        throw new ConflictException(
          `Permission with resource "${resource}" and action "${action}" already exists`,
        );
      }
    }

    await this.permissionRepository.update(
      { id },
      {
        name: updatePermissionDto.name,
        resource: updatePermissionDto.resource,
        action: updatePermissionDto.action,
        description: updatePermissionDto.description,
      },
    );

    const updatedPermission = await this.permissionRepository.findOne({
      where: { id },
    });

    return this.mapToResponseDto(updatedPermission!);
  }

  async remove(id: string): Promise<void> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    await this.permissionRepository.delete({ id });
  }

  private mapToResponseDto(permission: Permission): PermissionResponseDto {
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
