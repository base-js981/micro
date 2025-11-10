import { ApiProperty } from '@nestjs/swagger';

export class UploadFileResponseDto {
  @ApiProperty({ description: 'File key (path)' })
  key: string;

  @ApiProperty({ description: 'File URL' })
  url: string;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;

  @ApiProperty({ description: 'File MIME type' })
  mimetype: string;

  @ApiProperty({ description: 'File ETag (for S3)', required: false })
  etag?: string;
}

