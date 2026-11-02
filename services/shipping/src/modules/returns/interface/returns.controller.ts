import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  type CreateReturnBatchRequest,
  CreateReturnBatchRequestSchema,
  type ListExpectedReturnsQuery,
  ListExpectedReturnsQuerySchema,
  type ListExpectedReturnsResponse,
  type ListReturnBatchesQuery,
  ListReturnBatchesQuerySchema,
  type ListReturnBatchesResponse,
  type ReturnBatch,
  type ReturnSummaryQuery,
  ReturnSummaryQuerySchema,
  type ReturnSummaryResponse,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { z } from 'zod';
import { ReceiveReturnBatchUseCase } from '../application/receive-return-batch.use-case.js';
import { ReturnsQueryService } from '../application/returns-query.service.js';

/** The return-to-seller chain (#133): what the carriers owe back, and each hand-over. */
@Controller('returns')
export class ReturnsController {
  constructor(
    private readonly returns: ReturnsQueryService,
    private readonly receive: ReceiveReturnBatchUseCase,
  ) {}

  @Get('expected')
  @RequirePermission('orders.read')
  expected(
    @Query(new ZodValidationPipe(ListExpectedReturnsQuerySchema)) query: ListExpectedReturnsQuery,
    @CurrentStore() store: StoreContext,
  ): Promise<ListExpectedReturnsResponse> {
    return this.returns.expected(store.storeId, query);
  }

  @Get('summary')
  @RequirePermission('orders.read')
  summary(
    @Query(new ZodValidationPipe(ReturnSummaryQuerySchema)) query: ReturnSummaryQuery,
    @CurrentStore() store: StoreContext,
  ): Promise<ReturnSummaryResponse> {
    return this.returns.summary(store.storeId, query.overdueDays);
  }

  @Post('batches')
  @RequirePermission('shipments.manage')
  createBatch(
    @Body(new ZodValidationPipe(CreateReturnBatchRequestSchema)) body: CreateReturnBatchRequest,
    @CurrentStore() store: StoreContext,
  ): Promise<ReturnBatch> {
    return this.receive.execute(store, body);
  }

  @Get('batches')
  @RequirePermission('orders.read')
  batches(
    @Query(new ZodValidationPipe(ListReturnBatchesQuerySchema)) query: ListReturnBatchesQuery,
    @CurrentStore() store: StoreContext,
  ): Promise<ListReturnBatchesResponse> {
    return this.returns.batches(store.storeId, query);
  }

  @Get('batches/:id')
  @RequirePermission('orders.read')
  batch(
    @Param('id', new ZodValidationPipe(z.uuid())) id: string,
    @CurrentStore() store: StoreContext,
  ): Promise<ReturnBatch> {
    return this.returns.batch(store.storeId, id);
  }
}
