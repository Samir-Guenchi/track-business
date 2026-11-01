import { Inject, Injectable } from '@nestjs/common';
import {
  type EventEnvelope,
  type OrderReceivedEvent,
  OrderReceivedEventSchema,
} from '@trackecom/contracts';
import { CreateOrderUseCase } from '../../orders/application/create-order.use-case.js';
import type { OrderActor } from '../../orders/application/order-actor.js';
import { ORDERS_PORTS, type OrderRepository } from '../../orders/application/ports/orders.ports.js';
import { AlreadyImportedError } from '../../orders/domain/order.errors.js';
import { SystemStatusChange } from '../../shipment-status/application/system-status-change.js';

/** One consumer group for every replica of orders reading integrations' stream. */
export const SHOP_IMPORT_CONSUMER = 'orders.shop-import';

export type ImportResult = 'created' | 'cancelled' | 'duplicate' | 'ignored';

const NOTES_MAX = 1000;
const BY = { consumer: SHOP_IMPORT_CONSUMER, service: 'integrations' };

/**
 * Turns a shop order received by integrations (ADR-0003) into a TrackEcom order, once per
 * `(store, platform, shop order id)`. A cancellation in the shop cancels the imported order
 * when the status machine still allows it; changes to an already imported order are left to the
 * seller, so a webhook never overwrites what an agent confirmed.
 */
@Injectable()
export class ImportShopOrderUseCase {
  constructor(
    private readonly create: CreateOrderUseCase,
    @Inject(ORDERS_PORTS.repository) private readonly orders: OrderRepository,
    private readonly change: SystemStatusChange,
  ) {}

  async execute(event: EventEnvelope): Promise<ImportResult> {
    const data = OrderReceivedEventSchema.parse(event.data);
    const existing = await this.orders.findIdByExternalRef(
      event.storeId,
      data.connector,
      data.externalId,
    );
    if (data.cancelled) return existing ? this.cancel(event, existing) : 'ignored';
    if (existing) return 'duplicate';
    return this.createOrder(event, data);
  }

  private async createOrder(event: EventEnvelope, data: OrderReceivedEvent) {
    const notes = [`${data.connector} ${data.externalName}`, data.order.notes].filter(Boolean);
    try {
      await this.create.execute(actorFor(event), {
        ...data.order,
        notes: notes.join(' · ').slice(0, NOTES_MAX),
        source: data.connector,
        externalRef: data.externalId,
      });
      return 'created';
    } catch (error) {
      if (error instanceof AlreadyImportedError) return 'duplicate';
      throw error;
    }
  }

  private async cancel(event: EventEnvelope, orderId: string): Promise<ImportResult> {
    const result = await this.change.apply(event, {
      orderId,
      to: 'cancelled',
      reason: 'cancelled in the shop',
      by: BY,
    });
    return result === 'applied' ? 'cancelled' : result;
  }
}

const actorFor = (event: EventEnvelope): OrderActor => ({
  storeId: event.storeId,
  userId: BY.service,
  role: 'owner',
  ip: '',
  correlationId: event.correlationId,
  actorType: 'system',
});
