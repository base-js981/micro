import { IsString, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignPolicyDto {
  @ApiProperty({ description: 'Policy ID' })
  @IsString()
  @IsNotEmpty()
  policyId: string;

  @ApiPropertyOptional({ description: 'Role ID (if assigning to role)' })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.userId)
  roleId?: string;

  @ApiPropertyOptional({ description: 'User ID (if assigning to user)' })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.roleId)
  userId?: string;
}

