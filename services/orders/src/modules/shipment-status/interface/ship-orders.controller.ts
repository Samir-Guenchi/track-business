import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  type ShipOrdersRequest,
  ShipOrdersRequestSchema,
  type ShipOrdersResponse,
} from '@trackecom/contracts';
import { RequirePermission, ZodValidationPipe } from '@trackecom/service-kit';
import type { OrderActor } from '../../orders/application/order-actor.js';
import { CurrentActor } from '../../orders/interface/current-actor.decorator.js';
import { ShipOrdersUseCase } from '../application/ship-orders.use-case.js';

/** `POST /orders/ship`: answers at once; parcels are created in the background by shipping. */
@Controller('orders')
export class ShipOrdersController {
  constructor(private readonly shipOrders: ShipOrdersUseCase) {}

  @Post('ship')
  @HttpCode(202)
  @RequirePermission('shipments.manage')
  ship(
    @Body(new ZodValidationPipe(ShipOrdersRequestSchema)) body: ShipOrdersRequest,
    @CurrentActor() actor: OrderActor,
  ): Promise<ShipOrdersResponse> {
    return this.shipOrders.execute(actor, body);
  }
}
