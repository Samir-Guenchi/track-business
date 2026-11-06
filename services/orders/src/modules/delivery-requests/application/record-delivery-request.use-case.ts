import { Inject, Injectable } from '@nestjs/common';
import { createAuditEntry } from '@trackecom/audit';
import {
  type DeliveryRequestCreatedEvent,
  DeliveryRequestCreatedEventSchema,
  type EventEnvelope,
} from '@trackecom/contracts';
import { OrderChangeRecorder } from '../../orders/application/order-change.recorder.js';
import { ORDERS_PORTS, type OrderRepository } from '../../orders/application/ports/orders.ports.js';
import { EventAlreadyProcessedError } from '../../orders/domain/order.errors.js';
import { requestSummary } from '../domain/request-summary.js';
import {
  DELIVERY_REQUESTS_CONSUMER,
  ORDER_HISTORY_WRITER,
  type OrderHistoryWriter,
} from './order-history.port.js';

export type RecordResult = 'recorded' | 'ignored' | 'duplicate';

/**
 * A customer asked, from the tracking link, for another day, a stop-desk, a fixed address or a
 * call after a time (#136). The order history shows it next to the seller's own changes.
 */
@Injectable()
export class RecordDeliveryRequestUseCase {
  constructor(
    @Inject(ORDERS_PORTS.repository) private readonly orders: OrderRepository,
    @Inject(ORDER_HISTORY_WRITER) private readonly history: OrderHistoryWriter,
    private readonly recorder: OrderChangeRecorder,
  ) {}

  async execute(event: EventEnvelope): Promise<RecordResult> {
    const data = DeliveryRequestCreatedEventSchema.parse(event.data);
    const order = await this.orders.findById(event.storeId, data.orderId);
    if (!order) return 'ignored';
    try {
      await this.history.append(this.entry(event.storeId, data), {
        consumer: DELIVERY_REQUESTS_CONSUMER,
        eventId: event.id,
      });
    } catch (error) {
      if (error instanceof EventAlreadyProcessedError) return 'duplicate';
      throw error;
    }
    return 'recorded';
  }

  private entry(storeId: string, data: DeliveryRequestCreatedEvent) {
    return createAuditEntry(
      {
        storeId,
        entity: 'order',
        entityId: data.orderId,
        action: 'order.delivery_requested',
        actor: { type: 'system', id: 'shipping.delivery-request' },
        before: null,
        after: {
          requestId: data.requestId,
          shipmentId: data.shipmentId,
          ...data.request,
          summary: requestSummary(data.request),
        },
      },
      { newId: this.recorder.newId, now: this.recorder.now },
    );
  }
}
