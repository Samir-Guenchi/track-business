import { Module } from '@nestjs/common';
import { ClaimsQueryService } from './application/claims-query.service.js';
import { CLAIMS_CLOCK, CLAIMS_STORE } from './application/claims.ports.js';
import { ClaimsService } from './application/claims.service.js';
import { PrismaClaimsStore } from './infrastructure/prisma-claims.store.js';
import { ClaimsController } from './interface/claims.controller.js';

/** Claims against carriers for lost, stuck or damaged parcels (#139). */
@Module({
  controllers: [ClaimsController],
  providers: [
    ClaimsService,
    ClaimsQueryService,
    { provide: CLAIMS_STORE, useClass: PrismaClaimsStore },
    { provide: CLAIMS_CLOCK, useValue: () => new Date() },
  ],
})
export class ClaimsModule {}
