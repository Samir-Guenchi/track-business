import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  type ListPickupPointsResponse,
  type PickupPoint,
  PickupPointInputSchema,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { z } from 'zod';
import type { PointFields } from '../application/pickup-points.ports.js';
import { PickupPointsService } from '../application/pickup-points.service.js';

const fields = new ZodValidationPipe(PickupPointInputSchema);

/** The store's partner shops (#202). */
@Controller('pickup-points')
export class PickupPointsController {
  constructor(private readonly points: PickupPointsService) {}

  @Get()
  @RequirePermission('orders.read')
  list(@CurrentStore() store: StoreContext): Promise<ListPickupPointsResponse> {
    return this.points.list(store.storeId);
  }

  @Post()
  @RequirePermission('store.update')
  create(
    @Body(fields) body: PointFields,
    @CurrentStore() store: StoreContext,
  ): Promise<PickupPoint> {
    return this.points.create(store.storeId, body);
  }

  @Patch(':id')
  @RequirePermission('store.update')
  update(
    @Param('id', new ZodValidationPipe(z.uuid())) pointId: string,
    @Body(fields) body: PointFields,
    @CurrentStore() store: StoreContext,
  ): Promise<PickupPoint> {
    return this.points.update({ storeId: store.storeId, pointId }, body);
  }
}
