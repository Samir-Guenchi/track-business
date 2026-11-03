import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  type DecideReturnRequest,
  DecideReturnRequestSchema,
  type ListReturnRequestsQuery,
  ListReturnRequestsQuerySchema,
  type ListReturnRequestsResponse,
  type SellerReturnRequest,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { z } from 'zod';
import { SellerReturnRequestsService } from '../application/seller-return-requests.service.js';

/** Return and exchange requests customers sent from their tracking link (#201). */
@Controller('return-requests')
export class ReturnRequestsController {
  constructor(private readonly requests: SellerReturnRequestsService) {}

  @Get()
  @RequirePermission('orders.read')
  list(
    @Query(new ZodValidationPipe(ListReturnRequestsQuerySchema)) query: ListReturnRequestsQuery,
    @CurrentStore() store: StoreContext,
  ): Promise<ListReturnRequestsResponse> {
    return this.requests.list(store.storeId, query);
  }

  @Patch(':id')
  @RequirePermission('orders.write')
  decide(
    @Param('id', new ZodValidationPipe(z.uuid())) id: string,
    @Body(new ZodValidationPipe(DecideReturnRequestSchema)) body: DecideReturnRequest,
    @CurrentStore() store: StoreContext,
  ): Promise<SellerReturnRequest> {
    return this.requests.decide(store.storeId, id, body);
  }
}
