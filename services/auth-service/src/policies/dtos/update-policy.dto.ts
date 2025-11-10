import { IsString, IsOptional, IsArray, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePolicyRuleDto } from './create-policy-rule.dto';

export class UpdatePolicyDto {
  @ApiPropertyOptional({ description: 'Policy name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Policy description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Resource type' })
  @IsString()
  @IsOptional()
  resource?: string;

  @ApiPropertyOptional({ description: 'Action' })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiPropertyOptional({ description: 'Effect', enum: ['allow', 'deny'] })
  @IsString()
  @IsIn(['allow', 'deny'])
  @IsOptional()
  effect?: string;

  @ApiPropertyOptional({ description: 'Policy rules', type: [CreatePolicyRuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePolicyRuleDto)
  @IsOptional()
  rules?: CreatePolicyRuleDto[];
}

