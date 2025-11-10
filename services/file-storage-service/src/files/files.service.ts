import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IStorageAdapter, UploadFileResult, FileMetadata } from '../storage/interfaces/storage-adapter.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FilesService {
  constructor(@Inject('STORAGE_ADAPTER') private readonly storageAdapter: IStorageAdapter) {}

  async uploadFile(
    file: Express.Multer.File,
    folder?: string,
    customKey?: string,
  ): Promise<UploadFileResult> {
    // Generate key
    const key = customKey || this.generateKey(file.originalname, folder);

    // Upload file
    return this.storageAdapter.upload(file, key, {
      contentType: file.mimetype,
    });
  }

  async downloadFile(key: string): Promise<Buffer> {
    const exists = await this.storageAdapter.exists(key);
    if (!exists) {
      throw new NotFoundException(`File with key ${key} not found`);
    }

    return this.storageAdapter.download(key);
  }

  async getFileMetadata(key: string): Promise<FileMetadata> {
    const exists = await this.storageAdapter.exists(key);
    if (!exists) {
      throw new NotFoundException(`File with key ${key} not found`);
    }

    return this.storageAdapter.getMetadata(key);
  }

  async deleteFile(key: string): Promise<void> {
    const exists = await this.storageAdapter.exists(key);
    if (!exists) {
      throw new NotFoundException(`File with key ${key} not found`);
    }

    await this.storageAdapter.delete(key);
  }

  async fileExists(key: string): Promise<boolean> {
    return this.storageAdapter.exists(key);
  }

  async getPresignedUrl(key: string, expiresIn?: number): Promise<string> {
    const exists = await this.storageAdapter.exists(key);
    if (!exists) {
      throw new NotFoundException(`File with key ${key} not found`);
    }

    return this.storageAdapter.getPresignedUrl(key, expiresIn);
  }

  async listFiles(prefix?: string, maxKeys?: number): Promise<FileMetadata[]> {
    return this.storageAdapter.list(prefix, maxKeys);
  }

  private generateKey(originalName: string, folder?: string): string {
    const timestamp = Date.now();
    const uuid = uuidv4();
    const extension = originalName.substring(originalName.lastIndexOf('.'));
    const filename = `${timestamp}-${uuid}${extension}`;

    return folder ? `${folder}/${filename}` : filename;
  }
}

