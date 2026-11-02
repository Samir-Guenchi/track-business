import type { Provider } from '@nestjs/common';
import { ROLE_CACHE_STORE, type RoleCacheStore } from '@trackecom/service-kit';
import { RedisService } from './redis.service.js';

/** Store roles cache for StoreAccessModule, kept in this service's Redis. */
export const redisRoleCache: Provider = {
  provide: ROLE_CACHE_STORE,
  inject: [RedisService],
  useFactory: (redis: RedisService): RoleCacheStore => ({
    get: (key) => redis.get(key),
    set: async (key, value, ttlSeconds) => {
      await redis.set(key, value, 'EX', ttlSeconds);
    },
  }),
};
