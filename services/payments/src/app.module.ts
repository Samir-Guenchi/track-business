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
import { moneyOpenApiPaths } from './modules/money/interface/money.openapi.js';
import { MoneyModule } from './modules/money/money.module.js';

export const SERVICE_NAME = 'payments';

/** Root module (ADR-0002). Each feature module (money #42, wallet #44...) is one import. */
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
          title: 'TrackEcom payments',
          version: '0.1.0',
          paths: { ...moneyOpenApiPaths },
        }),
        StoreAccessModule.forRoot({
          options: { identityUrl: env.IDENTITY_URL, roleCacheSeconds: env.ROLE_CACHE_SECONDS },
          cache: redisRoleCache,
        }),
        MoneyModule,
      ],
    };
  }
}
