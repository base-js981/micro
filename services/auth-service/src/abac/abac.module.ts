import { Module } from '@nestjs/common';
import { AbacService } from './abac.service';
import { AbacGuard } from './abac.guard';
import { AbacInterceptor } from './abac.interceptor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AbacService, AbacGuard, AbacInterceptor],
  exports: [AbacService, AbacGuard, AbacInterceptor],
})
export class AbacModule {}

