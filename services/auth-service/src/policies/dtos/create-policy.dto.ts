import { IsString, IsNotEmpty, IsOptional, IsArray, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePolicyRuleDto } from './create-policy-rule.dto';

export class CreatePolicyDto {
  @ApiProperty({ description: 'Policy name', example: 'senior-engineer-write-users' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Policy description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Resource type', example: 'users' })
  @IsString()
  @IsNotEmpty()
  resource: string;

  @ApiProperty({ description: 'Action', example: 'write' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({ description: 'Effect', enum: ['allow', 'deny'], default: 'allow' })
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

