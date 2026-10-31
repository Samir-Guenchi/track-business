import { Inject, Injectable } from '@nestjs/common';
import {
  type EventEnvelope,
  ORDER_EVENTS,
  type OrderStatus,
  type OrderStatusChangedEvent,
  canTransition,
} from '@trackecom/contracts';
import { nextVersion } from '../../orders/application/load-order.js';
import type { OrderActor } from '../../orders/application/order-actor.js';
import { OrderChangeRecorder } from '../../orders/application/order-change.recorder.js';
import { ORDERS_PORTS, type OrderRepository } from '../../orders/application/ports/orders.ports.js';
import type { OrderRecord } from '../../orders/domain/order.js';
import { EventAlreadyProcessedError } from '../../orders/domain/order.errors.js';

/** One consumer group reads every shipping event orders cares about. */
export const SHIPMENT_STATUS_CONSUMER = 'orders.shipment-status';

export type ApplyResult = 'applied' | 'ignored' | 'duplicate';

export interface SystemChange {
  readonly orderId: string;
  readonly to: OrderStatus;
  readonly reason: string;
  /** Other order fields that change with the status (carrier, tracking number). */
  readonly fields?: Partial<Pick<OrderRecord, 'carrier' | 'trackingNumber'>>;
  readonly audit?: Record<string, unknown>;
}

const systemActor = (event: EventEnvelope): OrderActor => ({
  storeId: event.storeId,
  userId: 'shipping',
  role: 'owner',
  ip: '',
  correlationId: event.correlationId,
  actorType: 'system',
});

/**
 * A status change TrackEcom makes on its own because of a shipping event: audited as `system`,
 * announced like any change, and applied once per event (inbox row in the same transaction).
 * Changes the status machine refuses are ignored, not retried.
 */
@Injectable()
export class SystemStatusChange {
  constructor(
    @Inject(ORDERS_PORTS.repository) private readonly orders: OrderRepository,
    private readonly recorder: OrderChangeRecorder,
  ) {}

  async apply(event: EventEnvelope, change: SystemChange): Promise<ApplyResult> {
    const before = await this.orders.findById(event.storeId, change.orderId);
    if (!before || !canTransition(before.status, change.to)) return 'ignored';
    const now = this.recorder.now();
    const after = nextVersion(
      before,
      { ...change.fields, status: change.to, statusChangedAt: now },
      now,
    );
    const data: OrderStatusChangedEvent = {
      orderId: before.id,
      from: before.status,
      to: change.to,
      actorId: null,
      reason: change.reason,
    };
    const effects = this.recorder.effects(systemActor(event), {
      action: 'status_changed',
      before,
      after,
      extra: { reason: change.reason, ...change.audit },
      events: [{ type: ORDER_EVENTS.statusChanged, data }],
    });
    const consumed = { consumer: SHIPMENT_STATUS_CONSUMER, eventId: event.id };
    try {
      await this.orders.update(after, { ...effects, consumed });
      return 'applied';
    } catch (error) {
      if (error instanceof EventAlreadyProcessedError) return 'duplicate';
      throw error;
    }
  }
}
