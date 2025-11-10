import { ApiProperty } from '@nestjs/swagger';

export class PolicyRuleResponseDto {
  @ApiProperty({ description: 'Rule ID' })
  id: string;

  @ApiProperty({ description: 'Attribute path' })
  attribute: string;

  @ApiProperty({ description: 'Operator' })
  operator: string;

  @ApiProperty({ description: 'Value' })
  value: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

