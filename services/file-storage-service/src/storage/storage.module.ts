import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3StorageAdapter } from './adapters/s3-storage.adapter';
import { LocalStorageAdapter } from './adapters/local-storage.adapter';
import { IStorageAdapter } from './interfaces/storage-adapter.interface';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    S3StorageAdapter,
    LocalStorageAdapter,
    {
      provide: 'STORAGE_ADAPTER',
      useFactory: (
        configService: ConfigService,
        s3Adapter: S3StorageAdapter,
        localAdapter: LocalStorageAdapter,
      ): IStorageAdapter => {
        const storageType = configService.get<string>('STORAGE_TYPE', 'local');
        return storageType === 's3' ? s3Adapter : localAdapter;
      },
      inject: [ConfigService, S3StorageAdapter, LocalStorageAdapter],
    },
  ],
  exports: ['STORAGE_ADAPTER'],
})
export class StorageModule {}

