import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PolicyRuleResponseDto } from './policy-rule-response.dto';
import { PolicyAssignmentResponseDto } from './policy-assignment-response.dto';

export class PolicyResponseDto {
  @ApiProperty({ description: 'Policy ID' })
  id: string;

  @ApiProperty({ description: 'Policy name' })
  name: string;

  @ApiPropertyOptional({ description: 'Policy description' })
  description?: string;

  @ApiProperty({ description: 'Resource type' })
  resource: string;

  @ApiProperty({ description: 'Action' })
  action: string;

  @ApiProperty({ description: 'Effect', enum: ['allow', 'deny'] })
  effect: string;

  @ApiPropertyOptional({ description: 'Policy rules', type: [PolicyRuleResponseDto] })
  rules?: PolicyRuleResponseDto[];

  @ApiPropertyOptional({ description: 'Policy assignments', type: [PolicyAssignmentResponseDto] })
  assignments?: PolicyAssignmentResponseDto[];

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

