import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  type EventEnvelope,
  ORDER_EVENTS,
  ORDER_STATUS_FOR_PARCEL,
  type OrderStatusChangedEvent,
  ShipmentStatusChangedEventSchema,
  canTransition,
} from '@trackecom/contracts';
import { nextVersion } from '../../orders/application/load-order.js';
import type { OrderActor } from '../../orders/application/order-actor.js';
import { OrderChangeRecorder } from '../../orders/application/order-change.recorder.js';
import { ORDERS_PORTS, type OrderRepository } from '../../orders/application/ports/orders.ports.js';
import { EventAlreadyProcessedError } from '../../orders/domain/order.errors.js';

export const SHIPMENT_STATUS_CONSUMER = 'orders.shipment-status';

export type ApplyResult = 'applied' | 'ignored' | 'duplicate';

/**
 * Moves an order when its parcel moves (#32). Carrier scans that do not fit the order's state
 * (an old shipment, a manual override, a skipped scan we cannot map) are ignored, not retried.
 */
@Injectable()
export class ApplyShipmentStatusUseCase {
  private readonly logger = new Logger(ApplyShipmentStatusUseCase.name);

  constructor(
    @Inject(ORDERS_PORTS.repository) private readonly orders: OrderRepository,
    private readonly recorder: OrderChangeRecorder,
  ) {}

  async execute(event: EventEnvelope): Promise<ApplyResult> {
    const data = ShipmentStatusChangedEventSchema.parse(event.data);
    const target = ORDER_STATUS_FOR_PARCEL[data.to];
    const before = target ? await this.orders.findById(event.storeId, data.orderId) : null;
    if (!target || !before || !canTransition(before.status, target)) {
      this.logger.debug(`Ignoring ${data.to} for order ${data.orderId}`);
      return 'ignored';
    }
    const now = this.recorder.now();
    const after = nextVersion(before, { status: target, statusChangedAt: now }, now);
    const actor = this.systemActor(event);
    const reason = data.failureReason ? `${data.carrier}: ${data.failureReason}` : data.carrier;
    const change: OrderStatusChangedEvent = {
      orderId: before.id,
      from: before.status,
      to: target,
      actorId: null,
      reason,
    };
    const effects = this.recorder.effects(actor, {
      action: 'status_changed',
      before,
      after,
      extra: { reason, shipmentId: data.shipmentId },
      events: [{ type: ORDER_EVENTS.statusChanged, data: change }],
    });
    try {
      await this.orders.update(after, {
        ...effects,
        consumed: { consumer: SHIPMENT_STATUS_CONSUMER, eventId: event.id },
      });
      return 'applied';
    } catch (error) {
      if (error instanceof EventAlreadyProcessedError) return 'duplicate';
      throw error;
    }
  }

  private systemActor(event: EventEnvelope): OrderActor {
    return {
      storeId: event.storeId,
      userId: 'shipping',
      role: 'owner',
      ip: '',
      correlationId: event.correlationId,
      actorType: 'system',
    };
  }
}
