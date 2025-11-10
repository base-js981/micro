import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { FilesService } from './files.service';
import { UploadFileResponseDto } from './dtos/upload-file-response.dto';
import { FileMetadataResponseDto } from './dtos/file-metadata-response.dto';
import { PresignedUrlResponseDto } from './dtos/presigned-url-response.dto';
import { GatewayUserGuard, RolesGuard, Roles } from '@micro/common';

@ApiTags('files')
@Controller('files')
@UseGuards(GatewayUserGuard, RolesGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @Roles('admin', 'user')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          description: 'Optional folder path',
        },
        key: {
          type: 'string',
          description: 'Optional custom key (path)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: UploadFileResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid file or missing file' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
    @Query('key') key?: string,
  ): Promise<UploadFileResponseDto> {
    if (!file) {
      throw new Error('File is required');
    }

    return this.filesService.uploadFile(file, folder, key);
  }

  @Get(':key(*)')
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Download a file by key' })
  @ApiParam({ name: 'key', description: 'File key (path)', type: String })
  @ApiResponse({ status: 200, description: 'File content' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async downloadFile(@Param('key') key: string, @Res() res: Response): Promise<void> {
    const buffer = await this.filesService.downloadFile(key);
    const metadata = await this.filesService.getFileMetadata(key);

    res.setHeader('Content-Type', metadata.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${key.split('/').pop()}"`);
    res.setHeader('Content-Length', metadata.size.toString());

    res.send(buffer);
  }

  @Get(':key(*)/metadata')
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Get file metadata' })
  @ApiParam({ name: 'key', description: 'File key (path)', type: String })
  @ApiResponse({ status: 200, type: FileMetadataResponseDto })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFileMetadata(@Param('key') key: string): Promise<FileMetadataResponseDto> {
    return this.filesService.getFileMetadata(key);
  }

  @Delete(':key(*)')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiParam({ name: 'key', description: 'File key (path)', type: String })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteFile(@Param('key') key: string): Promise<{ message: string }> {
    await this.filesService.deleteFile(key);
    return { message: 'File deleted successfully' };
  }

  @Get(':key(*)/presigned-url')
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Get presigned URL for temporary access' })
  @ApiParam({ name: 'key', description: 'File key (path)', type: String })
  @ApiQuery({ name: 'expiresIn', required: false, description: 'Expiration time in seconds', type: Number })
  @ApiResponse({ status: 200, type: PresignedUrlResponseDto })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getPresignedUrl(
    @Param('key') key: string,
    @Query('expiresIn') expiresIn?: number,
  ): Promise<PresignedUrlResponseDto> {
    const url = await this.filesService.getPresignedUrl(key, expiresIn);
    return {
      url,
      expiresIn: expiresIn || 3600,
    };
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List files' })
  @ApiQuery({ name: 'prefix', required: false, description: 'Prefix to filter files', type: String })
  @ApiQuery({ name: 'maxKeys', required: false, description: 'Maximum number of files to return', type: Number })
  @ApiResponse({ status: 200, type: [FileMetadataResponseDto] })
  async listFiles(
    @Query('prefix') prefix?: string,
    @Query('maxKeys') maxKeys?: number,
  ): Promise<FileMetadataResponseDto[]> {
    return this.filesService.listFiles(prefix, maxKeys ? parseInt(maxKeys.toString(), 10) : undefined);
  }
}

