import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AbacGuardBase } from '@micro/common';
import { AbacService } from './abac.service';

@Injectable()
export class AbacGuard extends AbacGuardBase {
  constructor(
    reflector: Reflector,
    private readonly abacService: AbacService,
  ) {
    super(reflector);
  }

  protected getAbacService() {
    return this.abacService;
  }
}

