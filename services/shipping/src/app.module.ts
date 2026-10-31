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
import { CarriersModule } from './modules/carriers/carriers.module.js';
import { carriersOpenApiPaths } from './modules/carriers/interface/carriers.openapi.js';
import { GeoModule } from './modules/geo/geo.module.js';
import { geoOpenApiPaths } from './modules/geo/interface/geo.openapi.js';
import { pricingOpenApiPaths } from './modules/pricing/interface/pricing.openapi.js';
import { PricingModule } from './modules/pricing/pricing.module.js';

export const SERVICE_NAME = 'shipping';

/** Root module. Each feature module (geo #19, pricing #33, carriers #30, tracking #32...) is one import. */
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
          title: 'TrackEcom shipping',
          version: '0.1.0',
          paths: { ...geoOpenApiPaths, ...pricingOpenApiPaths, ...carriersOpenApiPaths },
        }),
        StoreAccessModule.forRoot({
          options: { identityUrl: env.IDENTITY_URL, roleCacheSeconds: env.ROLE_CACHE_SECONDS },
          cache: redisRoleCache,
        }),
        GeoModule,
        PricingModule,
        CarriersModule,
      ],
    };
  }
}
