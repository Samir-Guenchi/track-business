import { type DynamicModule, Module } from '@nestjs/common';
import { HealthModule, OpenApiModule, loggingModule, probe } from '@trackecom/service-kit';
import { AuthorizationModule } from './authorization/authorization.module.js';
import type { Env } from './config/env.schema.js';
import { InfrastructureModule } from './infrastructure/infrastructure.module.js';
import { PrismaService } from './infrastructure/prisma/prisma.service.js';
import { RedisService } from './infrastructure/redis/redis.service.js';
import { ordersOpenApiPaths } from './modules/orders/interface/orders.openapi.js';
import { OrdersModule } from './modules/orders/orders.module.js';

export const SERVICE_NAME = 'orders';

/** Root module. Each feature module (orders #22, confirmation #28...) is one import. */
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
          title: 'TrackEcom orders',
          version: '0.1.0',
          paths: { ...ordersOpenApiPaths },
        }),
        AuthorizationModule,
        OrdersModule,
      ],
    };
  }
}
