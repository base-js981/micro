import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FileMetadataResponseDto {
  @ApiProperty({ description: 'File key (path)' })
  key: string;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;

  @ApiProperty({ description: 'File MIME type' })
  mimetype: string;

  @ApiPropertyOptional({ description: 'Last modified date' })
  lastModified?: Date;

  @ApiPropertyOptional({ description: 'File ETag' })
  etag?: string;
}

