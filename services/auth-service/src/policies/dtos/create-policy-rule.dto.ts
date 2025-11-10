import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePolicyRuleDto {
  @ApiProperty({
    description: 'Attribute path',
    example: 'user.department',
    examples: ['user.department', 'user.level', 'resource.owner', 'environment.time'],
  })
  @IsString()
  @IsNotEmpty()
  attribute: string;

  @ApiProperty({
    description: 'Operator',
    enum: ['equals', 'notEquals', 'in', 'notIn', 'greaterThan', 'lessThan', 'contains'],
    example: 'equals',
  })
  @IsString()
  @IsIn(['equals', 'notEquals', 'in', 'notIn', 'greaterThan', 'lessThan', 'contains'])
  operator: string;

  @ApiProperty({
    description: 'Value (JSON string for complex values)',
    example: 'engineering',
    examples: ['engineering', '["engineering", "product"]', '10'],
  })
  @IsString()
  @IsNotEmpty()
  value: string;
}

