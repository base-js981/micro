import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PolicyAssignmentResponseDto {
  @ApiProperty({ description: 'Assignment ID' })
  id: string;

  @ApiProperty({ description: 'Policy ID' })
  policyId: string;

  @ApiPropertyOptional({ description: 'Role ID (if assigned to role)' })
  roleId?: string;

  @ApiPropertyOptional({ description: 'User ID (if assigned to user)' })
  userId?: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

