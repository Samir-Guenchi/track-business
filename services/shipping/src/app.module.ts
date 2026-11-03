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
import { ClaimsModule } from './modules/claims/claims.module.js';
import { claimsOpenApiPaths } from './modules/claims/interface/claims.openapi.js';
import { carriersOpenApiPaths } from './modules/carriers/interface/carriers.openapi.js';
import { GeoModule } from './modules/geo/geo.module.js';
import { geoOpenApiPaths } from './modules/geo/interface/geo.openapi.js';
import { pricingOpenApiPaths } from './modules/pricing/interface/pricing.openapi.js';
import { PricingModule } from './modules/pricing/pricing.module.js';
import { CarrierFeesModule } from './modules/carrier-fees/carrier-fees.module.js';
import { AttemptChecksModule } from './modules/attempt-checks/attempt-checks.module.js';
import { attemptChecksOpenApiPaths } from './modules/attempt-checks/interface/attempt-checks.openapi.js';
import { stuckParcelsOpenApiPaths } from './modules/stuck-parcels/interface/stuck-parcels.openapi.js';
import { StuckParcelsModule } from './modules/stuck-parcels/stuck-parcels.module.js';
import { DeliveryRequestsModule } from './modules/delivery-requests/delivery-requests.module.js';
import { deliveryRequestsOpenApiPaths } from './modules/delivery-requests/interface/delivery-requests.openapi.js';
import { returnsOpenApiPaths } from './modules/returns/interface/returns.openapi.js';
import { ReturnsModule } from './modules/returns/returns.module.js';
import { stopDesksOpenApiPaths } from './modules/stop-desks/interface/stop-desks.openapi.js';
import { StopDesksModule } from './modules/stop-desks/stop-desks.module.js';
import { ShipmentsModule } from './modules/shipments/shipments.module.js';
import { suggestionOpenApiPaths } from './modules/suggestion/interface/suggestion.openapi.js';
import { SuggestionModule } from './modules/suggestion/suggestion.module.js';
import { trackingOpenApiPaths } from './modules/tracking/interface/tracking.openapi.js';
import { TrackingModule } from './modules/tracking/tracking.module.js';

export const SERVICE_NAME = 'shipping';

const OPEN_API = {
  title: 'TrackEcom shipping',
  version: '0.1.0',
  paths: {
    ...geoOpenApiPaths,
    ...pricingOpenApiPaths,
    ...carriersOpenApiPaths,
    ...trackingOpenApiPaths,
    ...suggestionOpenApiPaths,
    ...returnsOpenApiPaths,
    ...deliveryRequestsOpenApiPaths,
    ...stuckParcelsOpenApiPaths,
    ...attemptChecksOpenApiPaths,
    ...stopDesksOpenApiPaths,
    ...claimsOpenApiPaths,
  },
};

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
        OpenApiModule.forRoot(OPEN_API),
        StoreAccessModule.forRoot({
          options: { identityUrl: env.IDENTITY_URL, roleCacheSeconds: env.ROLE_CACHE_SECONDS },
          cache: redisRoleCache,
        }),
        GeoModule,
        PricingModule,
        CarriersModule,
        TrackingModule,
        ShipmentsModule,
        SuggestionModule,
        ReturnsModule,
        DeliveryRequestsModule,
        CarrierFeesModule,
        StuckParcelsModule,
        AttemptChecksModule,
        StopDesksModule,
        ClaimsModule,
      ],
    };
  }
}
