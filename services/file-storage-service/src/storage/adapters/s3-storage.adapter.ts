import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageAdapter, UploadFileResult, FileMetadata } from '../interfaces/storage-adapter.interface';

@Injectable()
export class S3StorageAdapter implements IStorageAdapter {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly endpoint?: string;
  private readonly forcePathStyle: boolean;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('S3_BUCKET', 'file-storage');
    this.region = this.configService.get<string>('S3_REGION', 'us-east-1');
    this.endpoint = this.configService.get<string>('S3_ENDPOINT');
    this.forcePathStyle = this.configService.get<boolean>('S3_FORCE_PATH_STYLE', false);

    const s3Config: any = {
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get<string>('S3_SECRET_ACCESS_KEY', ''),
      },
    };

    if (this.endpoint) {
      s3Config.endpoint = this.endpoint;
      s3Config.forcePathStyle = this.forcePathStyle;
    }

    this.s3Client = new S3Client(s3Config);
  }

  async upload(
    file: Express.Multer.File,
    key: string,
    options?: { contentType?: string; metadata?: Record<string, string> },
  ): Promise<UploadFileResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: options?.contentType || file.mimetype,
      Metadata: options?.metadata,
    });

    const result = await this.s3Client.send(command);

    // Generate URL
    let url: string;
    if (this.endpoint) {
      // S3-compatible storage (MinIO, etc.)
      url = `${this.endpoint}/${this.bucket}/${key}`;
    } else {
      // AWS S3
      url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    }

    return {
      key,
      url,
      size: file.size,
      mimetype: file.mimetype,
      etag: result.ETag?.replace(/"/g, ''),
    };
  }

  async download(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const result = await this.s3Client.send(command);
    const chunks: Uint8Array[] = [];

    if (result.Body) {
      for await (const chunk of result.Body as any) {
        chunks.push(chunk);
      }
    }

    return Buffer.concat(chunks);
  }

  async getMetadata(key: string): Promise<FileMetadata> {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const result = await this.s3Client.send(command);

    return {
      key,
      size: result.ContentLength || 0,
      mimetype: result.ContentType || 'application/octet-stream',
      lastModified: result.LastModified,
      etag: result.ETag?.replace(/"/g, ''),
    };
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.getMetadata(key);
      return true;
    } catch {
      return false;
    }
  }

  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async list(prefix?: string, maxKeys: number = 1000): Promise<FileMetadata[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const result = await this.s3Client.send(command);

    return (
      result.Contents?.map((object) => ({
        key: object.Key || '',
        size: object.Size || 0,
        mimetype: 'application/octet-stream',
        lastModified: object.LastModified,
        etag: object.ETag?.replace(/"/g, ''),
      })) || []
    );
  }
}

