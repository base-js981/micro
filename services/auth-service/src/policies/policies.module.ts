import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoliciesService } from './policies.service';
import { PoliciesController } from './policies.controller';
import { Policy, PolicyRule, PolicyAssignment, Role, User } from '@micro/database';

@Module({
  imports: [
    TypeOrmModule.forFeature([Policy, PolicyRule, PolicyAssignment, Role, User]),
  ],
  controllers: [PoliciesController],
  providers: [PoliciesService],
  exports: [PoliciesService],
})
export class PoliciesModule {}

