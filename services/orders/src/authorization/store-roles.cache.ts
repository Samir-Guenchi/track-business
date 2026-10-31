import { Inject, Injectable } from '@nestjs/common';
import { StoreRoleSchema, type StoreRole } from '@trackecom/contracts';
import { z } from 'zod';
import { type Env, ENV } from '../config/env.schema.js';
import { RedisService } from '../infrastructure/redis/redis.service.js';
import { IdentityClient } from './identity.client.js';

const RolesSchema = z.record(z.string(), StoreRoleSchema);

/** Caches each user's roles briefly so identity is not called on every request. */
@Injectable()
export class StoreRolesCache {
  constructor(
    private readonly identity: IdentityClient,
    private readonly redis: RedisService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async roleIn(storeId: string, userId: string, token: string): Promise<StoreRole | null> {
    const key = `orders:roles:${userId}`;
    const cached = await this.redis.get(key).catch(() => null);
    const roles = cached
      ? RolesSchema.parse(JSON.parse(cached))
      : await this.fetchAndStore(key, token);
    return roles[storeId] ?? null;
  }

  /** A Redis outage only costs a call to identity; it never blocks the request. */
  private async fetchAndStore(key: string, token: string): Promise<Record<string, StoreRole>> {
    const roles = await this.identity.rolesOf(token);
    if (this.env.ROLE_CACHE_SECONDS > 0)
      await this.redis
        .set(key, JSON.stringify(roles), 'EX', this.env.ROLE_CACHE_SECONDS)
        .catch(() => undefined);
    return roles;
  }
}
