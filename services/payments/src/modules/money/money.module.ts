import { Module } from '@nestjs/common';
import { ImportPayoutUseCase } from './application/import-payout.use-case.js';
import { MoneyQueries } from './application/money-queries.js';
import { ParcelEventsUseCase } from './application/parcel-events.use-case.js';
import { PayoutMatcher } from './application/payout-matcher.js';
import { MONEY_REPOSITORY } from './application/ports/money.repository.js';
import { PAYOUT_REPOSITORY } from './application/ports/payout.repository.js';
import { ParcelEventsConsumer } from './infrastructure/parcel-events.consumer.js';
import { PayoutMatcherWorker } from './infrastructure/payout-matcher.worker.js';
import { PrismaMoneyRepository } from './infrastructure/prisma-money.repository.js';
import { PrismaPayoutRepository } from './infrastructure/prisma-payout.repository.js';
import { MoneyController } from './interface/money.controller.js';
import { PayoutsController } from './interface/payouts.controller.js';

/** Parcels that owe COD, carrier payouts and the store's ledger (#42). */
@Module({
  controllers: [MoneyController, PayoutsController],
  providers: [
    ParcelEventsUseCase,
    MoneyQueries,
    ParcelEventsConsumer,
    ImportPayoutUseCase,
    PayoutMatcher,
    PayoutMatcherWorker,
    { provide: MONEY_REPOSITORY, useClass: PrismaMoneyRepository },
    { provide: PAYOUT_REPOSITORY, useClass: PrismaPayoutRepository },
  ],
  exports: [MONEY_REPOSITORY],
})
export class MoneyModule {}
