import { ApiProperty } from '@nestjs/swagger';

export class PresignedUrlResponseDto {
  @ApiProperty({ description: 'Presigned URL for temporary access' })
  url: string;

  @ApiProperty({ description: 'Expiration time in seconds' })
  expiresIn: number;
}

