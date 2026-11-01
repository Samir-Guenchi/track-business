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
import { notificationsOpenApiPaths } from './modules/messages/interface/notifications.openapi.js';
import { MessagesModule } from './modules/messages/messages.module.js';

export const SERVICE_NAME = 'notifications';

/** Root module (ADR-0004). Each feature module (customer messages #46, in-app #37...) is one import. */
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
          title: 'TrackEcom notifications',
          version: '0.1.0',
          paths: { ...notificationsOpenApiPaths },
        }),
        StoreAccessModule.forRoot({
          options: { identityUrl: env.IDENTITY_URL, roleCacheSeconds: env.ROLE_CACHE_SECONDS },
          cache: redisRoleCache,
        }),
        MessagesModule,
      ],
    };
  }
}
