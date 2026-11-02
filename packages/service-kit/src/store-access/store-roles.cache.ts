import { Inject, Injectable } from '@nestjs/common';
import { StoreRoleSchema, type StoreRole } from '@trackecom/contracts';
import { z } from 'zod';
import { IdentityClient } from './identity.client.js';
import {
  ROLE_CACHE_STORE,
  type RoleCacheStore,
  STORE_ACCESS_OPTIONS,
  type StoreAccessOptions,
} from './store-access.options.js';

const RolesSchema = z.record(z.string(), StoreRoleSchema);

/** Caches each user's roles briefly so identity is not called on every request. A cache outage only costs a call to identity. */
@Injectable()
export class StoreRolesCache {
  constructor(
    private readonly identity: IdentityClient,
    @Inject(ROLE_CACHE_STORE) private readonly cache: RoleCacheStore,
    @Inject(STORE_ACCESS_OPTIONS) private readonly options: StoreAccessOptions,
  ) {}

  async roleIn(storeId: string, userId: string, token: string): Promise<StoreRole | null> {
    const key = `store-roles:${userId}`;
    const cached = await this.cache.get(key).catch(() => null);
    const roles = cached
      ? RolesSchema.parse(JSON.parse(cached))
      : await this.fetchAndStore(key, token);
    return roles[storeId] ?? null;
  }

  /** A Redis outage only costs a call to identity; it never blocks the request. */
  private async fetchAndStore(key: string, token: string): Promise<Record<string, StoreRole>> {
    const roles = await this.identity.rolesOf(token);
    if (this.options.roleCacheSeconds > 0)
      await this.cache
        .set(key, JSON.stringify(roles), this.options.roleCacheSeconds)
        .catch(() => undefined);
    return roles;
  }
}
