import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok', description: 'Service status' })
  status: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Current timestamp' })
  timestamp: string;

  @ApiProperty({ example: 'connected', description: 'Database connection status' })
  database: string;
}

