import { type DynamicModule, Module, type Provider } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { IdentityClient } from './identity.client.js';
import { StoreAccessGuard } from './store-access.guard.js';
import { STORE_ACCESS_OPTIONS, type StoreAccessOptions } from './store-access.options.js';
import { StoreRolesCache } from './store-roles.cache.js';

export interface StoreAccessModuleOptions {
  readonly options: StoreAccessOptions;
  /** Provides ROLE_CACHE_STORE, usually backed by the service's Redis. */
  readonly cache: Provider;
}

/**
 * Installs the deny-by-default store guard for a service other than identity. Routes declare
 * @Public() or @RequirePermission(...); anything else is refused.
 */
@Module({})
export class StoreAccessModule {
  static forRoot({ options, cache }: StoreAccessModuleOptions): DynamicModule {
    return {
      module: StoreAccessModule,
      providers: [
        { provide: STORE_ACCESS_OPTIONS, useValue: options },
        cache,
        IdentityClient,
        StoreRolesCache,
        { provide: APP_GUARD, useClass: StoreAccessGuard },
      ],
    };
  }
}
