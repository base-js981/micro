import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';
import { IStorageAdapter, UploadFileResult, FileMetadata } from '../interfaces/storage-adapter.interface';

@Injectable()
export class LocalStorageAdapter implements IStorageAdapter {
  private readonly storagePath: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.storagePath = this.configService.get<string>('LOCAL_STORAGE_PATH', './storage');
    this.baseUrl = this.configService.get<string>('LOCAL_STORAGE_BASE_URL', 'http://localhost:5001/files');
  }

  private getFilePath(key: string): string {
    return join(this.storagePath, key);
  }

  private async ensureDirectory(key: string): Promise<void> {
    const filePath = this.getFilePath(key);
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    await fs.mkdir(dir, { recursive: true });
  }

  async upload(
    file: Express.Multer.File,
    key: string,
    options?: { contentType?: string; metadata?: Record<string, string> },
  ): Promise<UploadFileResult> {
    await this.ensureDirectory(key);
    const filePath = this.getFilePath(key);
    await fs.writeFile(filePath, file.buffer);

    const url = `${this.baseUrl}/${key}`;

    return {
      key,
      url,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  async download(key: string): Promise<Buffer> {
    const filePath = this.getFilePath(key);
    return fs.readFile(filePath);
  }

  async getMetadata(key: string): Promise<FileMetadata> {
    const filePath = this.getFilePath(key);
    const stats = await fs.stat(filePath);

    return {
      key,
      size: stats.size,
      mimetype: 'application/octet-stream', // Local storage doesn't store mimetype
      lastModified: stats.mtime,
    };
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);
    await fs.unlink(filePath);
  }

  async exists(key: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // For local storage, return a direct URL (no expiration in this simple implementation)
    return `${this.baseUrl}/${key}`;
  }

  async list(prefix?: string, maxKeys: number = 1000): Promise<FileMetadata[]> {
    const prefixPath = prefix ? join(this.storagePath, prefix) : this.storagePath;
    const files: FileMetadata[] = [];

    async function walkDir(dir: string, currentPrefix: string = ''): Promise<void> {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativePath = currentPrefix ? `${currentPrefix}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
          await walkDir(fullPath, relativePath);
        } else {
          const stats = await fs.stat(fullPath);
          files.push({
            key: relativePath,
            size: stats.size,
            mimetype: 'application/octet-stream',
            lastModified: stats.mtime,
          });

          if (files.length >= maxKeys) {
            return;
          }
        }
      }
    }

    await walkDir(prefixPath, prefix || '');
    return files;
  }
}

