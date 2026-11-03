import { Module } from '@nestjs/common';
import { ClaimsQueryService } from './application/claims-query.service.js';
import { CLAIMS_CLOCK, CLAIMS_STORE } from './application/claims.ports.js';
import { ClaimsService } from './application/claims.service.js';
import { SCORE_ROWS, ScorecardService } from './application/scorecard.service.js';
import { PrismaClaimsStore } from './infrastructure/prisma-claims.store.js';
import { PrismaScoreRows } from './infrastructure/prisma-score-rows.js';
import { ClaimsController } from './interface/claims.controller.js';
import { ScorecardController } from './interface/scorecard.controller.js';

/** Claims against carriers for lost, stuck or damaged parcels, and the carrier scorecard (#139). */
@Module({
  controllers: [ClaimsController, ScorecardController],
  providers: [
    ClaimsService,
    ClaimsQueryService,
    ScorecardService,
    { provide: SCORE_ROWS, useClass: PrismaScoreRows },
    { provide: CLAIMS_STORE, useClass: PrismaClaimsStore },
    { provide: CLAIMS_CLOCK, useValue: () => new Date() },
  ],
})
export class ClaimsModule {}
