import { Controller, Get, Param } from '@nestjs/common';
import type { OrderTrackingResponse } from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { z } from 'zod';
import { TrackingQueryService } from '../application/tracking-query.service.js';
import { toOrderTracking } from './tracking.dto.js';

/** The seller's view of an order's parcels, scoped to the store in `x-store-id`. */
@Controller('tracking')
export class TrackingController {
  constructor(private readonly tracking: TrackingQueryService) {}

  @Get('orders/:orderId')
  @RequirePermission('orders.read')
  async forOrder(
    @Param('orderId', new ZodValidationPipe(z.uuid())) orderId: string,
    @CurrentStore() store: StoreContext,
  ): Promise<OrderTrackingResponse> {
    return toOrderTracking(await this.tracking.forOrder(store.storeId, orderId));
  }
}
