import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';
import {
  User,
  Role,
  Permission,
  RolePermission,
  UserRole,
  RefreshToken,
  UserAttribute,
  Policy,
  PolicyRule,
  PolicyAssignment,
} from '@micro/database';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        
        if (!databaseUrl) {
          throw new Error('DATABASE_URL environment variable is required');
        }

        // Parse Oracle connection string
        const url = new URL(databaseUrl);
        const host = url.hostname;
        const port = parseInt(url.port || '1521', 10);
        const username = url.username;
        const password = url.password;
        const serviceName = url.pathname.replace('/', '');

        return {
          type: 'oracle',
          host,
          port,
          username,
          password,
          serviceName,
          synchronize: false,
          logging: configService.get<string>('NODE_ENV') === 'development',
          entities: [
            User,
            Role,
            Permission,
            RolePermission,
            UserRole,
            RefreshToken,
            UserAttribute,
            Policy,
            PolicyRule,
            PolicyAssignment,
          ],
          extra: {
            max: 10,
            min: 2,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService, TypeOrmModule],
})
export class DatabaseModule {}

