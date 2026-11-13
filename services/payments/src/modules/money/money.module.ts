import { Module } from '@nestjs/common';
import { ImportPayoutUseCase } from './application/import-payout.use-case.js';
import { MissingParcelSweep } from './application/missing-parcel-sweep.js';
import { MoneyQueries } from './application/money-queries.js';
import { ParcelEventsUseCase } from './application/parcel-events.use-case.js';
import { PayoutMatcher } from './application/payout-matcher.js';
import { MONEY_REPOSITORY } from './application/ports/money.repository.js';
import { MONEY_READS, MONEY_SETTINGS, OVERDUE_PARCELS } from './application/ports/money-reads.js';
import { PAYOUT_REPOSITORY } from './application/ports/payout.repository.js';
import { ParcelEventsConsumer } from './infrastructure/parcel-events.consumer.js';
import { MissingParcelWorker } from './infrastructure/missing-parcel.worker.js';
import { PayoutMatcherWorker } from './infrastructure/payout-matcher.worker.js';
import { PrismaMoneyReads } from './infrastructure/prisma-money-reads.js';
import { PrismaMoneySettings } from './infrastructure/prisma-money-settings.js';
import { PrismaOverdueParcels } from './infrastructure/prisma-overdue-parcels.js';
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
    MissingParcelSweep,
    MissingParcelWorker,
    { provide: MONEY_REPOSITORY, useClass: PrismaMoneyRepository },
    { provide: PAYOUT_REPOSITORY, useClass: PrismaPayoutRepository },
    { provide: MONEY_READS, useClass: PrismaMoneyReads },
    { provide: MONEY_SETTINGS, useClass: PrismaMoneySettings },
    { provide: OVERDUE_PARCELS, useClass: PrismaOverdueParcels },
  ],
  exports: [MONEY_REPOSITORY],
})
export class MoneyModule {}
