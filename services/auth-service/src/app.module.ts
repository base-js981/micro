import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TokensModule } from './tokens/tokens.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { PoliciesModule } from './policies/policies.module';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import { AbacModule } from './abac/abac.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    DatabaseModule,
    AuthModule,
    TokensModule,
    PermissionsModule,
    RolesModule,
    PoliciesModule,
    HealthModule,
    AbacModule,
  ],
})
export class AppModule {}

