import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { IdentityClient } from './identity.client.js';
import { StoreAccessGuard } from './store-access.guard.js';
import { StoreRolesCache } from './store-roles.cache.js';

@Module({
  providers: [IdentityClient, StoreRolesCache, { provide: APP_GUARD, useClass: StoreAccessGuard }],
})
export class AuthorizationModule {}
