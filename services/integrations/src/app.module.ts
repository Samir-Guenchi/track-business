import { type DynamicModule, Module } from '@nestjs/common';
import {
  HealthModule,
  OpenApiModule,
  StoreAccessModule,
  loggingModule,
  probe,
} from '@trackecom/service-kit';
import type { Env } from './config/env.schema.js';
import { InfrastructureModule } from './infrastructure/infrastructure.module.js';
import { PrismaService } from './infrastructure/prisma/prisma.service.js';
import { redisRoleCache } from './infrastructure/redis/redis-role-cache.js';
import { RedisService } from './infrastructure/redis/redis.service.js';
import { ConnectionsModule } from './modules/connections/connections.module.js';
import { connectionsOpenApiPaths } from './modules/connections/interface/connections.openapi.js';
import { syncOpenApiPaths } from './modules/sync/interface/sync.openapi.js';
import { SyncModule } from './modules/sync/sync.module.js';

export const SERVICE_NAME = 'integrations';

/** Root module (ADR-0003). Each feature module (connections, sync, fulfilment) is one import. */
@Module({})
export class AppModule {
  static forRoot(env: Env): DynamicModule {
    return {
      module: AppModule,
      imports: [
        loggingModule({ service: SERVICE_NAME, level: env.LOG_LEVEL }),
        InfrastructureModule.forRoot(env),
        HealthModule.forRoot({
          service: SERVICE_NAME,
          inject: [PrismaService, RedisService],
          useFactory: (prisma: PrismaService, redis: RedisService) => [
            { name: 'database', isHealthy: () => probe(() => prisma.$queryRaw`SELECT 1`) },
            { name: 'redis', isHealthy: () => probe(() => redis.ping()) },
          ],
        }),
        OpenApiModule.forRoot({
          title: 'TrackEcom integrations',
          version: '0.1.0',
          paths: { ...connectionsOpenApiPaths, ...syncOpenApiPaths },
        }),
        StoreAccessModule.forRoot({
          options: { identityUrl: env.IDENTITY_URL, roleCacheSeconds: env.ROLE_CACHE_SECONDS },
          cache: redisRoleCache,
        }),
        ConnectionsModule,
        SyncModule,
      ],
    };
  }
}
