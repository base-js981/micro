import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { RoleResponseDto } from './dtos/role-response.dto';
import { AssignPermissionDto } from './dtos/assign-permission.dto';
import { PermissionResponseDto } from '../permissions/dtos/permission-response.dto';
import { GatewayUserGuard, RolesGuard, Roles } from '@micro/common';

@ApiTags('roles')
@Controller('roles')
@UseGuards(GatewayUserGuard, RolesGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List all roles' })
  @ApiResponse({ status: 200, type: [RoleResponseDto] })
  async findAll(): Promise<RoleResponseDto[]> {
    return this.rolesService.findAll();
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, type: RoleResponseDto })
  async create(@Body() createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    return this.rolesService.create(createRoleDto);
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({ status: 200, type: RoleResponseDto })
  async findOne(@Param('id') id: string): Promise<RoleResponseDto> {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update role' })
  @ApiResponse({ status: 200, type: RoleResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete role' })
  @ApiResponse({ status: 200 })
  async remove(@Param('id') id: string): Promise<void> {
    return this.rolesService.remove(id);
  }

  @Get(':id/permissions')
  @Roles('admin')
  @ApiOperation({ summary: 'Get role permissions' })
  @ApiResponse({ status: 200, type: [PermissionResponseDto] })
  async getRolePermissions(@Param('id') id: string): Promise<PermissionResponseDto[]> {
    return this.rolesService.getRolePermissions(id);
  }

  @Post(':id/permissions')
  @Roles('admin')
  @ApiOperation({ summary: 'Assign permission to role' })
  @ApiResponse({ status: 201 })
  async assignPermission(
    @Param('id') roleId: string,
    @Body() assignPermissionDto: AssignPermissionDto,
  ): Promise<void> {
    return this.rolesService.assignPermission(roleId, assignPermissionDto.permissionId);
  }

  @Delete(':id/permissions/:permissionId')
  @Roles('admin')
  @ApiOperation({ summary: 'Remove permission from role' })
  @ApiResponse({ status: 200 })
  async removePermission(
    @Param('id') roleId: string,
    @Param('permissionId') permissionId: string,
  ): Promise<void> {
    return this.rolesService.removePermission(roleId, permissionId);
  }
}

