import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PoliciesService } from './policies.service';
import { CreatePolicyDto } from './dtos/create-policy.dto';
import { UpdatePolicyDto } from './dtos/update-policy.dto';
import { PolicyResponseDto } from './dtos/policy-response.dto';
import { CreatePolicyRuleDto } from './dtos/create-policy-rule.dto';
import { PolicyRuleResponseDto } from './dtos/policy-rule-response.dto';
import { AssignPolicyDto } from './dtos/assign-policy.dto';
import { PolicyAssignmentResponseDto } from './dtos/policy-assignment-response.dto';
import { GatewayUserGuard, RolesGuard, Roles } from '@micro/common';

@ApiTags('policies')
@Controller('policies')
@UseGuards(GatewayUserGuard, RolesGuard)
@ApiBearerAuth()
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List all policies' })
  @ApiResponse({ status: 200, type: [PolicyResponseDto] })
  async findAll(): Promise<PolicyResponseDto[]> {
    return this.policiesService.findAll();
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new policy' })
  @ApiResponse({ status: 201, type: PolicyResponseDto })
  @ApiResponse({ status: 409, description: 'Policy with this name already exists' })
  async create(@Body() createPolicyDto: CreatePolicyDto): Promise<PolicyResponseDto> {
    return this.policiesService.create(createPolicyDto);
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get policy by ID' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiResponse({ status: 200, type: PolicyResponseDto })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  async findOne(@Param('id') id: string): Promise<PolicyResponseDto> {
    return this.policiesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update policy' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiResponse({ status: 200, type: PolicyResponseDto })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  @ApiResponse({ status: 409, description: 'Policy with this name already exists' })
  async update(
    @Param('id') id: string,
    @Body() updatePolicyDto: UpdatePolicyDto,
  ): Promise<PolicyResponseDto> {
    return this.policiesService.update(id, updatePolicyDto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete policy' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiResponse({ status: 204, description: 'Policy deleted successfully' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.policiesService.remove(id);
  }

  // Policy Rules Management
  @Get(':id/rules')
  @Roles('admin')
  @ApiOperation({ summary: 'Get policy rules' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiResponse({ status: 200, type: [PolicyRuleResponseDto] })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  async getPolicyRules(@Param('id') id: string): Promise<PolicyRuleResponseDto[]> {
    return this.policiesService.getPolicyRules(id);
  }

  @Post(':id/rules')
  @Roles('admin')
  @ApiOperation({ summary: 'Add rule to policy' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiResponse({ status: 201, type: PolicyRuleResponseDto })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  async addPolicyRule(
    @Param('id') policyId: string,
    @Body() createRuleDto: CreatePolicyRuleDto,
  ): Promise<PolicyRuleResponseDto> {
    return this.policiesService.addPolicyRule(policyId, createRuleDto);
  }

  @Delete(':id/rules/:ruleId')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove rule from policy' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiParam({ name: 'ruleId', description: 'Rule ID' })
  @ApiResponse({ status: 204, description: 'Rule removed successfully' })
  @ApiResponse({ status: 404, description: 'Policy or rule not found' })
  async removePolicyRule(
    @Param('id') policyId: string,
    @Param('ruleId') ruleId: string,
  ): Promise<void> {
    return this.policiesService.removePolicyRule(policyId, ruleId);
  }

  // Policy Assignments Management
  @Get(':id/assignments')
  @Roles('admin')
  @ApiOperation({ summary: 'Get policy assignments' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiResponse({ status: 200, type: [PolicyAssignmentResponseDto] })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  async getPolicyAssignments(
    @Param('id') id: string,
  ): Promise<PolicyAssignmentResponseDto[]> {
    return this.policiesService.getPolicyAssignments(id);
  }

  @Post(':id/assignments')
  @Roles('admin')
  @ApiOperation({ summary: 'Assign policy to role or user' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiResponse({ status: 201, type: PolicyAssignmentResponseDto })
  @ApiResponse({ status: 404, description: 'Policy, role, or user not found' })
  @ApiResponse({ status: 409, description: 'Policy already assigned' })
  async assignPolicy(
    @Param('id') policyId: string,
    @Body() assignPolicyDto: AssignPolicyDto,
  ): Promise<PolicyAssignmentResponseDto> {
    return this.policiesService.assignPolicy(
      policyId,
      assignPolicyDto.roleId,
      assignPolicyDto.userId,
    );
  }

  @Delete(':id/assignments')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unassign policy from role or user' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiResponse({ status: 204, description: 'Policy unassigned successfully' })
  @ApiResponse({ status: 404, description: 'Policy assignment not found' })
  async unassignPolicy(
    @Param('id') policyId: string,
    @Body() assignPolicyDto: AssignPolicyDto,
  ): Promise<void> {
    return this.policiesService.unassignPolicy(
      policyId,
      assignPolicyDto.roleId,
      assignPolicyDto.userId,
    );
  }
}

