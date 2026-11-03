import { Controller, Get, Query } from '@nestjs/common';
import {
  type ScorecardQuery,
  ScorecardQuerySchema,
  type ScorecardResponse,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { ScorecardService } from '../application/scorecard.service.js';

/** The carrier scorecard (#139): numbers to choose and negotiate with carriers. */
@Controller('carrier-scorecard')
export class ScorecardController {
  constructor(private readonly scorecard: ScorecardService) {}

  @Get()
  @RequirePermission('orders.read')
  get(
    @Query(new ZodValidationPipe(ScorecardQuerySchema)) query: ScorecardQuery,
    @CurrentStore() store: StoreContext,
  ): Promise<ScorecardResponse> {
    return this.scorecard.scorecard(store.storeId, query);
  }
}
