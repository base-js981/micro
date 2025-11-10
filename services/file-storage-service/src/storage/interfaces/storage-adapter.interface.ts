export interface UploadFileResult {
  key: string;
  url: string;
  size: number;
  mimetype: string;
  etag?: string;
}

export interface FileMetadata {
  key: string;
  size: number;
  mimetype: string;
  lastModified?: Date;
  etag?: string;
}

export interface IStorageAdapter {
  /**
   * Upload a file to storage
   */
  upload(
    file: Express.Multer.File,
    key: string,
    options?: { contentType?: string; metadata?: Record<string, string> },
  ): Promise<UploadFileResult>;

  /**
   * Download a file from storage
   */
  download(key: string): Promise<Buffer>;

  /**
   * Get file metadata
   */
  getMetadata(key: string): Promise<FileMetadata>;

  /**
   * Delete a file from storage
   */
  delete(key: string): Promise<void>;

  /**
   * Check if file exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Generate a presigned URL for temporary access
   */
  getPresignedUrl(key: string, expiresIn?: number): Promise<string>;

  /**
   * List files with optional prefix
   */
  list(prefix?: string, maxKeys?: number): Promise<FileMetadata[]>;
}

