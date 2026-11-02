import { Module } from '@nestjs/common';
import { ConnectionsModule } from '../connections/connections.module.js';
import { FULFILMENT_PORTS } from './application/ports/fulfilment.ports.js';
import { PushFulfilmentUseCase } from './application/push-fulfilment.use-case.js';
import { ShopFulfiller } from './application/shop-fulfiller.js';
import { FulfilmentConsumer } from './infrastructure/fulfilment.consumer.js';
import { HttpOrderOrigins } from './infrastructure/http-order-origins.js';
import { PrismaFulfilmentTargets } from './infrastructure/prisma-fulfilment-targets.js';

/** Tracking back to the shop once a parcel exists (#47, ADR-0003). */
@Module({
  imports: [ConnectionsModule],
  providers: [
    PushFulfilmentUseCase,
    ShopFulfiller,
    FulfilmentConsumer,
    { provide: FULFILMENT_PORTS.origins, useClass: HttpOrderOrigins },
    { provide: FULFILMENT_PORTS.targets, useClass: PrismaFulfilmentTargets },
  ],
})
export class FulfilmentModule {}
