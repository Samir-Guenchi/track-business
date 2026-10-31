import { Module } from '@nestjs/common';
import { BlacklistUseCases } from './application/blacklist.use-cases.js';
import { FRAUD_PORTS } from './application/ports/fraud.ports.js';
import { RiskAssessor } from './application/risk-assessor.js';
import { PrismaBlacklistRepository } from './infrastructure/prisma-blacklist.repository.js';
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
  ],
  exports: [RiskAssessor],
})
export class FraudModule {}
