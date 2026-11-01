import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import type { OrderContact, OrderOrigin } from '@trackecom/contracts';
import { InternalTokenGuard, Public, ZodValidationPipe } from '@trackecom/service-kit';
import { z } from 'zod';
import { OrderQueries } from '../application/order-queries.js';

export const UuidPipe = new ZodValidationPipe(z.uuid());

/**
 * Service-to-service reads (ADR-0004). No user token: the caller presents the shared internal
 * token, and the store comes from the path because the caller acts for that store's event.
 */
@Public()
@UseGuards(InternalTokenGuard)
@Controller('internal/stores/:storeId/orders')
export class InternalOrdersController {
  constructor(private readonly queries: OrderQueries) {}

  /** Who notifications should message about this order: name, phone and ref only. */
  @Get(':orderId/contact')
  async contact(
    @Param('storeId', UuidPipe) storeId: string,
    @Param('orderId', UuidPipe) orderId: string,
  ): Promise<OrderContact> {
    const order = await this.queries.get(storeId, orderId);
    return {
      orderId: order.id,
      ref: order.ref,
      name: order.customer.name,
      phone: order.customer.phone,
    };
  }

  /** Where the order came from: integrations pushes tracking back to the shop (ADR-0003). */
  @Get(':orderId/origin')
  async origin(
    @Param('storeId', UuidPipe) storeId: string,
    @Param('orderId', UuidPipe) orderId: string,
  ): Promise<OrderOrigin> {
    const order = await this.queries.get(storeId, orderId);
    return { orderId: order.id, source: order.source, externalRef: order.externalRef };
  }
}
