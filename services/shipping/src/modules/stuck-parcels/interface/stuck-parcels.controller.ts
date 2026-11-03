import { Controller, Get, Query } from '@nestjs/common';
import {
  type StuckParcelsQuery,
  StuckParcelsQuerySchema,
  type StuckParcelsResponse,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { StuckParcelsService } from '../application/stuck-parcels.service.js';

/** Parcels with no tracking news for too long, and where it piles up (#197). */
@Controller('stuck-parcels')
export class StuckParcelsController {
  constructor(private readonly stuck: StuckParcelsService) {}

  @Get()
  @RequirePermission('orders.read')
  list(
    @Query(new ZodValidationPipe(StuckParcelsQuerySchema)) query: StuckParcelsQuery,
    @CurrentStore() store: StoreContext,
  ): Promise<StuckParcelsResponse> {
    return this.stuck.list(store.storeId, query);
  }
}
