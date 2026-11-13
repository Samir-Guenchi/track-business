import { Module } from '@nestjs/common';
import { ATTEMPT_CHECKS_CLOCK, ATTEMPT_CHECKS_STORE } from './application/attempt-checks.ports.js';
import { AttemptChecksService } from './application/attempt-checks.service.js';
import { PrismaAttemptChecksStore } from './infrastructure/prisma-attempt-checks.store.js';
import { AttemptChecksController } from './interface/attempt-checks.controller.js';
import { PublicAttemptChecksController } from './interface/public-attempt-checks.controller.js';

/** Fake failed-attempt check (#195): the customer says whether the courier really tried. */
@Module({
  controllers: [PublicAttemptChecksController, AttemptChecksController],
  providers: [
    AttemptChecksService,
    { provide: ATTEMPT_CHECKS_STORE, useClass: PrismaAttemptChecksStore },
    { provide: ATTEMPT_CHECKS_CLOCK, useValue: () => new Date() },
  ],
})
export class AttemptChecksModule {}
