import { Module } from '@nestjs/common';
import { GetReturnRiskUseCase } from './application/get-return-risk.use-case.js';
import { RETURN_RISK_READS } from './application/ports/return-risk.reads.js';
import { PrismaReturnRiskReads } from './infrastructure/prisma-return-risk.reads.js';
import { RiskScoreController } from './interface/risk-score.controller.js';

/** Return-risk score v1 (#50): rules over the store's own history, with reasons. */
@Module({
  controllers: [RiskScoreController],
  providers: [
    GetReturnRiskUseCase,
    { provide: RETURN_RISK_READS, useClass: PrismaReturnRiskReads },
  ],
})
export class RiskScoreModule {}
