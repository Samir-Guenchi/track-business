import { Body, Controller, Get, HttpCode, Inject, Param, Post, Query } from '@nestjs/common';
import {
  type DecideFollowupRequest,
  DecideFollowupRequestSchema,
  type DeliveryFollowup,
  type FollowupMetricsQuery,
  FollowupMetricsQuerySchema,
  type FollowupMetricsResponse,
  type ListFollowupsQuery,
  ListFollowupsQuerySchema,
  type ListFollowupsResponse,
} from '@trackecom/contracts';
import { RequirePermission, ZodValidationPipe } from '@trackecom/service-kit';
import type { OrderActor } from '../../orders/application/order-actor.js';
import { ORDERS_PORTS, type Clock } from '../../orders/application/ports/orders.ports.js';
import { CurrentActor } from '../../orders/interface/current-actor.decorator.js';
import { OrderIdPipe } from '../../orders/interface/orders.controller.js';
import { DecideFollowupUseCase } from '../application/decide-followup.use-case.js';
import { FOLLOWUP_STORE, type FollowupStore } from '../application/followup.ports.js';
import { toDto } from '../infrastructure/followup-mapping.js';

/** The failed-delivery queue (#132): parcels a courier could not deliver, most urgent first. */
@Controller('orders/followups')
export class FollowupsController {
  constructor(
    @Inject(FOLLOWUP_STORE) private readonly followups: FollowupStore,
    @Inject(ORDERS_PORTS.clock) private readonly now: Clock,
    private readonly decideFollowup: DecideFollowupUseCase,
  ) {}

  @Get()
  @RequirePermission('orders.read')
  async list(
    @Query(new ZodValidationPipe(ListFollowupsQuerySchema)) query: ListFollowupsQuery,
    @CurrentActor() actor: OrderActor,
  ): Promise<ListFollowupsResponse> {
    const page = await this.followups.list(actor.storeId, query, this.now());
    return { items: page.items.map(toDto), nextCursor: page.nextCursor };
  }

  @Get('metrics')
  @RequirePermission('orders.read')
  async metrics(
    @Query(new ZodValidationPipe(FollowupMetricsQuerySchema)) query: FollowupMetricsQuery,
    @CurrentActor() actor: OrderActor,
  ): Promise<FollowupMetricsResponse> {
    return { items: await this.followups.metrics(actor.storeId, query) };
  }

  @Post(':id/decision')
  @HttpCode(200)
  @RequirePermission('orders.confirm')
  async decide(
    @Param('id', OrderIdPipe) id: string,
    @Body(new ZodValidationPipe(DecideFollowupRequestSchema)) body: DecideFollowupRequest,
    @CurrentActor() actor: OrderActor,
  ): Promise<DeliveryFollowup> {
    return toDto(await this.decideFollowup.execute(actor, id, body));
  }
}
