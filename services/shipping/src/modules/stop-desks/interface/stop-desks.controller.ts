import { Controller, Get, Header, Param, Post, Query } from '@nestjs/common';
import {
  CarrierCodeSchema,
  type ListStopDesksQuery,
  ListStopDesksQuerySchema,
  type ListStopDesksResponse,
  type SyncStopDesksResponse,
} from '@trackecom/contracts';
import {
  CurrentStore,
  Public,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { StopDeskQueries } from '../application/stop-desk-queries.js';
import { SyncStopDesksUseCase } from '../application/sync-stop-desks.use-case.js';

/** Stop-desk finder for order forms and tracking pages, and the carrier list sync (#137). */
@Controller()
export class StopDesksController {
  constructor(
    private readonly desks: StopDeskQueries,
    private readonly sync: SyncStopDesksUseCase,
  ) {}

  @Get('geo/stop-desks')
  @Public()
  @Header('cache-control', 'public, max-age=300')
  async list(
    @Query(new ZodValidationPipe(ListStopDesksQuerySchema)) query: ListStopDesksQuery,
  ): Promise<ListStopDesksResponse> {
    return { items: await this.desks.list(query) };
  }

  @Post('stop-desks/sync/:carrier')
  @RequirePermission('store.update')
  syncCarrier(
    @Param('carrier', new ZodValidationPipe(CarrierCodeSchema)) carrier: string,
    @CurrentStore() store: StoreContext,
  ): Promise<SyncStopDesksResponse> {
    return this.sync.execute(store.storeId, carrier);
  }
}
