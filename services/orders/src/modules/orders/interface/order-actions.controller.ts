import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
  type BulkOrdersRequest,
  BulkOrdersRequestSchema,
  type BulkOrdersResponse,
  type ChangeStatusRequest,
  ChangeStatusRequestSchema,
  type Order,
  type OrderHistoryResponse,
} from '@trackecom/contracts';
import { RequirePermission, ZodValidationPipe } from '@trackecom/service-kit';
import { BulkOrdersUseCase } from '../application/bulk-orders.use-case.js';
import { ChangeStatusUseCase } from '../application/change-status.use-case.js';
import type { OrderActor } from '../application/order-actor.js';
import { OrderQueries } from '../application/order-queries.js';
import { toOrderDto } from '../infrastructure/order.mapper.js';
import { CurrentActor } from './current-actor.decorator.js';
import { OrderIdPipe } from './orders.controller.js';

/**
 * Status, bulk and history. The route only needs `orders.read`; the use cases then check the
 * permission each action needs (agents confirm, packers ship, managers edit).
 */
@Controller('orders')
export class OrderActionsController {
  constructor(
    private readonly statuses: ChangeStatusUseCase,
    private readonly bulk: BulkOrdersUseCase,
    private readonly queries: OrderQueries,
  ) {}

  @Post(':id/status')
  @HttpCode(200)
  @RequirePermission('orders.read')
  async changeStatus(
    @Param('id', OrderIdPipe) id: string,
    @Body(new ZodValidationPipe(ChangeStatusRequestSchema)) body: ChangeStatusRequest,
    @CurrentActor() actor: OrderActor,
  ): Promise<Order> {
    return toOrderDto(await this.statuses.execute(actor, id, body));
  }

  @Post('bulk')
  @HttpCode(200)
  @RequirePermission('orders.read')
  applyBulk(
    @Body(new ZodValidationPipe(BulkOrdersRequestSchema)) body: BulkOrdersRequest,
    @CurrentActor() actor: OrderActor,
  ): Promise<BulkOrdersResponse> {
    return this.bulk.execute(actor, body);
  }

  @Get(':id/history')
  @RequirePermission('orders.read')
  async history(
    @Param('id', OrderIdPipe) id: string,
    @CurrentActor() actor: OrderActor,
  ): Promise<OrderHistoryResponse> {
    return { items: await this.queries.history(actor.storeId, id) };
  }
}
