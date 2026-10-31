import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from '../modules/auth/auth.module.js';
import { StoresModule } from '../modules/stores/stores.module.js';
import { AuthorizationGuard } from './authorization.guard.js';

@Module({
  imports: [AuthModule, StoresModule],
  providers: [{ provide: APP_GUARD, useClass: AuthorizationGuard }],
})
export class AuthorizationModule {}
