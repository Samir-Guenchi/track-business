import { Module } from '@nestjs/common';
import { type Env, ENV } from '../../config/env.schema.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { BlacklistUseCases } from './application/blacklist.use-cases.js';
import {
  type BlacklistRepository,
  FRAUD_PORTS,
  type GeoDirectory,
  type NetworkSignal,
  type RecentOrders,
} from './application/ports/fraud.ports.js';
import { RiskAssessor, type RiskSources } from './application/risk-assessor.js';
import { HttpGeoDirectory } from './infrastructure/http-geo-directory.js';
import { PrismaBlacklistRepository } from './infrastructure/prisma-blacklist.repository.js';
import {
  PrismaNetworkSignal,
  disabledNetworkSignal,
} from './infrastructure/prisma-network-signal.js';
import { PrismaRecentOrders } from './infrastructure/prisma-recent-orders.js';
import { BlacklistController } from './interface/blacklist.controller.js';

/** Store blacklist and fake-order checks (#52); orders asks RiskAssessor on every new order. */
@Module({
  controllers: [BlacklistController],
  providers: [
    BlacklistUseCases,
    RiskAssessor,
    { provide: FRAUD_PORTS.blacklist, useClass: PrismaBlacklistRepository },
    { provide: FRAUD_PORTS.recentOrders, useClass: PrismaRecentOrders },
    { provide: FRAUD_PORTS.geo, useClass: HttpGeoDirectory },
    {
      provide: FRAUD_PORTS.network,
      inject: [ENV, PrismaService],
      useFactory: (env: Env, prisma: PrismaService): NetworkSignal =>
        env.NETWORK_SIGNAL_ENABLED ? new PrismaNetworkSignal(prisma) : disabledNetworkSignal,
    },
    {
      provide: FRAUD_PORTS.sources,
      inject: [
        FRAUD_PORTS.blacklist,
        FRAUD_PORTS.recentOrders,
        FRAUD_PORTS.geo,
        FRAUD_PORTS.network,
      ],
      useFactory: (
        ...[blacklist, orders, geo, network]: [
          BlacklistRepository,
          RecentOrders,
          GeoDirectory,
          NetworkSignal,
        ]
      ): RiskSources => ({ blacklist, orders, geo, network }),
    },
  ],
  exports: [RiskAssessor],
})
export class FraudModule {}
