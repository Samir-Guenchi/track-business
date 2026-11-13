import { Body, Controller, Param, Post } from '@nestjs/common';
import { CreateExchangeRequestSchema, type Order } from '@trackecom/contracts';
import { RequirePermission, ZodValidationPipe } from '@trackecom/service-kit';
import type { z } from 'zod';
import type { OrderActor } from '../../orders/application/order-actor.js';
import { toOrderDto } from '../../orders/infrastructure/order.mapper.js';
import { CurrentActor } from '../../orders/interface/current-actor.decorator.js';
import { OrderIdPipe } from '../../orders/interface/orders.controller.js';
import { CreateExchangeUseCase } from '../application/create-exchange.use-case.js';

/** Size or colour swaps of delivered orders (#138). */
@Controller('orders')
export class ExchangeController {
  constructor(private readonly exchanges: CreateExchangeUseCase) {}

  @Post(':id/exchange')
  @RequirePermission('orders.write')
  async create(
    @Param('id', OrderIdPipe) id: string,
    @Body(new ZodValidationPipe(CreateExchangeRequestSchema))
    body: z.output<typeof CreateExchangeRequestSchema>,
    @CurrentActor() actor: OrderActor,
  ): Promise<Order> {
    return toOrderDto(await this.exchanges.execute(actor, id, body));
  }
}
