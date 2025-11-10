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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { UpdatePermissionDto } from './dtos/update-permission.dto';
import { PermissionResponseDto } from './dtos/permission-response.dto';
import { GatewayUserGuard, RolesGuard, Roles } from '@micro/common';

@ApiTags('permissions')
@Controller('permissions')
@UseGuards(GatewayUserGuard, RolesGuard)
@ApiBearerAuth()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List all permissions' })
  @ApiResponse({ status: 200, type: [PermissionResponseDto] })
  async findAll(): Promise<PermissionResponseDto[]> {
    return this.permissionsService.findAll();
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ status: 201, type: PermissionResponseDto })
  async create(@Body() createPermissionDto: CreatePermissionDto): Promise<PermissionResponseDto> {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiResponse({ status: 200, type: PermissionResponseDto })
  async findOne(@Param('id') id: string): Promise<PermissionResponseDto> {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update permission' })
  @ApiResponse({ status: 200, type: PermissionResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ): Promise<PermissionResponseDto> {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete permission' })
  @ApiResponse({ status: 200 })
  async remove(@Param('id') id: string): Promise<void> {
    return this.permissionsService.remove(id);
  }
}

