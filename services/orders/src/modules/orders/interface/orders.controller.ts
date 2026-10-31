import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import {
  CreateOrderRequestSchema,
  type ListOrdersQuery,
  ListOrdersQuerySchema,
  type ListOrdersResponse,
  type Order,
  UpdateOrderRequestSchema,
} from '@trackecom/contracts';
import { RequirePermission, ZodValidationPipe } from '@trackecom/service-kit';
import { z } from 'zod';
import { CreateOrderUseCase } from '../application/create-order.use-case.js';
import type { OrderActor } from '../application/order-actor.js';
import { OrderAdminUseCases } from '../application/order-admin.use-cases.js';
import { OrderQueries } from '../application/order-queries.js';
import { UpdateOrderUseCase } from '../application/update-order.use-case.js';
import { toOrderDto } from '../infrastructure/order.mapper.js';
import { CurrentActor } from './current-actor.decorator.js';

export const OrderIdPipe = new ZodValidationPipe(z.uuid());

/** CRUD on the orders of the store in `x-store-id`. */
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly updateOrder: UpdateOrderUseCase,
    private readonly queries: OrderQueries,
  ) {}

  @Post()
  @RequirePermission('orders.write')
  async create(
    @Body(new ZodValidationPipe(CreateOrderRequestSchema)) body: z.output<typeof CreateOrderRequestSchema>,
    @CurrentActor() actor: OrderActor,
  ): Promise<Order> {
    return toOrderDto(await this.createOrder.execute(actor, body));
  }

  @Get()
  @RequirePermission('orders.read')
  async list(
    @Query(new ZodValidationPipe(ListOrdersQuerySchema)) query: ListOrdersQuery,
    @CurrentActor() actor: OrderActor,
  ): Promise<ListOrdersResponse> {
    const page = await this.queries.list(actor.storeId, query);
    return { items: page.items.map(toOrderDto), nextCursor: page.nextCursor };
  }

  @Get(':id')
  @RequirePermission('orders.read')
  async get(@Param('id', OrderIdPipe) id: string, @CurrentActor() actor: OrderActor): Promise<Order> {
    return toOrderDto(await this.queries.get(actor.storeId, id));
  }

  @Put(':id')
  @RequirePermission('orders.write')
  async update(
    @Param('id', OrderIdPipe) id: string,
    @Body(new ZodValidationPipe(UpdateOrderRequestSchema)) body: z.output<typeof UpdateOrderRequestSchema>,
    @CurrentActor() actor: OrderActor,
  ): Promise<Order> {
    return toOrderDto(await this.updateOrder.execute(actor, id, body));
  }
}

/** Deletion is separate so the CRUD controller keeps three dependencies. */
@Controller('orders')
export class OrderDeletionController {
  constructor(private readonly admin: OrderAdminUseCases) {}

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('orders.write')
  async remove(@Param('id', OrderIdPipe) id: string, @CurrentActor() actor: OrderActor): Promise<void> {
    await this.admin.delete(actor, id);
  }
}
