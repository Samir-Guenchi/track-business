import { Module } from '@nestjs/common';
import { EXPECTED_FEES, FeeAuditUseCase, PAYOUT_LINES } from './application/fee-audit.use-case.js';
import { HttpExpectedFees } from './infrastructure/http-expected-fees.js';
import { PrismaPayoutLines } from './infrastructure/prisma-payout-lines.js';
import { FeeAuditController } from './interface/fee-audit.controller.js';

/** Carrier fee audit on payouts (#196). */
@Module({
  controllers: [FeeAuditController],
  providers: [
    FeeAuditUseCase,
    { provide: PAYOUT_LINES, useClass: PrismaPayoutLines },
    { provide: EXPECTED_FEES, useClass: HttpExpectedFees },
  ],
})
export class FeeAuditModule {}
