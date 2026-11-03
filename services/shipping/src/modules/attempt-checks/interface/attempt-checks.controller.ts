import { Controller, Get, Query } from '@nestjs/common';
import {
  type AttemptChecksQuery,
  AttemptChecksQuerySchema,
  type AttemptChecksReport,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { AttemptChecksService } from '../application/attempt-checks.service.js';

/** Per carrier, how often customers say the courier never came (#195), and which parcels. */
@Controller('attempt-checks')
export class AttemptChecksController {
  constructor(private readonly checks: AttemptChecksService) {}

  @Get()
  @RequirePermission('orders.read')
  report(
    @Query(new ZodValidationPipe(AttemptChecksQuerySchema)) query: AttemptChecksQuery,
    @CurrentStore() store: StoreContext,
  ): Promise<AttemptChecksReport> {
    return this.checks.report(store.storeId, query.days);
  }
}
