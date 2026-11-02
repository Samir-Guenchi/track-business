import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  type DeliveryRequest,
  type ListDeliveryRequestsQuery,
  ListDeliveryRequestsQuerySchema,
  type ListDeliveryRequestsResponse,
  type UpdateDeliveryRequest,
  UpdateDeliveryRequestSchema,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { z } from 'zod';
import { SellerDeliveryRequestsService } from '../application/seller-delivery-requests.service.js';

/** What customers asked from their tracking link, and the seller's answer (#136). */
@Controller('delivery-requests')
export class DeliveryRequestsController {
  constructor(private readonly requests: SellerDeliveryRequestsService) {}

  @Get()
  @RequirePermission('orders.read')
  list(
    @Query(new ZodValidationPipe(ListDeliveryRequestsQuerySchema)) query: ListDeliveryRequestsQuery,
    @CurrentStore() store: StoreContext,
  ): Promise<ListDeliveryRequestsResponse> {
    return this.requests.list(store.storeId, query);
  }

  @Patch(':id')
  @RequirePermission('shipments.manage')
  update(
    @Param('id', new ZodValidationPipe(z.uuid())) id: string,
    @Body(new ZodValidationPipe(UpdateDeliveryRequestSchema)) body: UpdateDeliveryRequest,
    @CurrentStore() store: StoreContext,
  ): Promise<DeliveryRequest> {
    return this.requests.update(store, id, body);
  }
}
