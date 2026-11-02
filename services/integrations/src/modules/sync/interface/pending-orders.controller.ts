import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import {
  type PendingShopOrder,
  type PendingShopOrdersResponse,
  type ResolvePendingOrderRequest,
  ResolvePendingOrderRequestSchema,
  type SkipPendingOrderRequest,
  SkipPendingOrderRequestSchema,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { PendingOrdersService } from '../application/pending-orders.service.js';
import type { PendingOrder } from '../application/ports/sync.ports.js';

const toDto = ({ connection, order, problem, receivedAt }: PendingOrder): PendingShopOrder => {
  const lines = order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const { name, phone, address, city, province } = order.customer;
  return {
    connectionId: connection.id,
    externalId: order.externalId,
    externalName: order.name,
    problem,
    customer: { name, phone, address, city, province },
    total: lines + order.shippingFee - order.discount,
    currency: order.currency,
    receivedAt: receivedAt.toISOString(),
  };
};

/** Shop orders that need the seller before they become orders (#47). */
@Controller('integrations/orders/needs-fix')
export class PendingOrdersController {
  constructor(private readonly pending: PendingOrdersService) {}

  @Get()
  @RequirePermission('orders.read')
  async list(@CurrentStore() store: StoreContext): Promise<PendingShopOrdersResponse> {
    return { items: (await this.pending.list(store.storeId)).map(toDto) };
  }

  @Post('resolve')
  @HttpCode(204)
  @RequirePermission('orders.write')
  async resolve(
    @Body(new ZodValidationPipe(ResolvePendingOrderRequestSchema)) body: ResolvePendingOrderRequest,
    @CurrentStore() store: StoreContext,
  ): Promise<void> {
    await this.pending.resolve(store.storeId, body);
  }

  @Post('skip')
  @HttpCode(204)
  @RequirePermission('orders.write')
  async skip(
    @Body(new ZodValidationPipe(SkipPendingOrderRequestSchema)) body: SkipPendingOrderRequest,
    @CurrentStore() store: StoreContext,
  ): Promise<void> {
    await this.pending.skip(store.storeId, body);
  }
}
