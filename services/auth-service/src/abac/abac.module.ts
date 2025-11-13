import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AbacService } from './abac.service';
import { AbacGuard } from './abac.guard';
import { AbacInterceptor } from './abac.interceptor';
import { Policy, PolicyAssignment, User, UserAttribute } from '@micro/database';

@Module({
  imports: [
    TypeOrmModule.forFeature([Policy, PolicyAssignment, User, UserAttribute]),
  ],
  providers: [AbacService, AbacGuard, AbacInterceptor],
  exports: [AbacService, AbacGuard, AbacInterceptor],
})
export class AbacModule {}

