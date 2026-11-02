import { Module } from '@nestjs/common';
import { ReceiveReturnBatchUseCase } from './application/receive-return-batch.use-case.js';
import { ReturnsQueryService } from './application/returns-query.service.js';
import { RETURNS_CLOCK, RETURNS_STORE } from './application/returns.ports.js';
import { PrismaReturnsStore } from './infrastructure/prisma-returns.store.js';
import { ReturnsController } from './interface/returns.controller.js';

/** Return-to-seller chain (#133): expected returns, scanned hand-overs, lost-return alerts. */
@Module({
  controllers: [ReturnsController],
  providers: [
    ReturnsQueryService,
    ReceiveReturnBatchUseCase,
    { provide: RETURNS_STORE, useClass: PrismaReturnsStore },
    { provide: RETURNS_CLOCK, useValue: () => new Date() },
  ],
})
export class ReturnsModule {}
