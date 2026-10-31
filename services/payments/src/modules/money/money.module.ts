import { Module } from '@nestjs/common';
import { MoneyQueries } from './application/money-queries.js';
import { ParcelEventsUseCase } from './application/parcel-events.use-case.js';
import { MONEY_REPOSITORY } from './application/ports/money.repository.js';
import { ParcelEventsConsumer } from './infrastructure/parcel-events.consumer.js';
import { PrismaMoneyRepository } from './infrastructure/prisma-money.repository.js';
import { MoneyController } from './interface/money.controller.js';

/** Parcels that owe COD and the store's ledger (#42). Payout import and matching plug in here. */
@Module({
  controllers: [MoneyController],
  providers: [
    ParcelEventsUseCase,
    MoneyQueries,
    ParcelEventsConsumer,
    { provide: MONEY_REPOSITORY, useClass: PrismaMoneyRepository },
  ],
  exports: [MONEY_REPOSITORY],
})
export class MoneyModule {}
