import { Inject, Injectable } from '@nestjs/common';
import {
  type EventEnvelope,
  type ShipmentStatusChangedEvent,
  ShipmentStatusChangedEventSchema,
} from '@trackecom/contracts';
import { OrderChangeRecorder } from '../../orders/application/order-change.recorder.js';
import { ORDERS_PORTS, type OrderRepository } from '../../orders/application/ports/orders.ports.js';
import { EventAlreadyProcessedError } from '../../orders/domain/order.errors.js';
import {
  type FollowupRecord,
  closedBy,
  openFollowup,
  withAnotherAttempt,
} from '../domain/followup.js';
import { FOLLOWUP_CONSUMER, FOLLOWUP_STORE, type FollowupStore } from './followup.ports.js';

export type TrackResult = 'opened' | 'updated' | 'ignored' | 'duplicate';

/**
 * Opens a follow-up on each failed attempt (#132) and closes it when the parcel is delivered or
 * returned. Each bus event is applied once.
 */
@Injectable()
export class TrackFollowupsUseCase {
  constructor(
    @Inject(FOLLOWUP_STORE) private readonly followups: FollowupStore,
    @Inject(ORDERS_PORTS.repository) private readonly orders: OrderRepository,
    private readonly recorder: OrderChangeRecorder,
  ) {}

  async execute(event: EventEnvelope): Promise<TrackResult> {
    const data = ShipmentStatusChangedEventSchema.parse(event.data);
    const current = await this.followups.findByShipment(event.storeId, data.shipmentId);
    const next =
      data.to === 'failed_attempt'
        ? await this.afterFailure(event.storeId, data, current)
        : current && closedBy(current, data.to, this.recorder.now());
    if (!next) return 'ignored';
    try {
      await this.followups.save(next, {
        events: [],
        consumed: { consumer: FOLLOWUP_CONSUMER, eventId: event.id },
      });
    } catch (error) {
      if (error instanceof EventAlreadyProcessedError) return 'duplicate';
      throw error;
    }
    return current ? 'updated' : 'opened';
  }

  private async afterFailure(
    storeId: string,
    data: ShipmentStatusChangedEvent,
    current: FollowupRecord | null,
  ): Promise<FollowupRecord | null> {
    const attempt = { reason: data.failureReason ?? 'other', at: new Date(data.at) } as const;
    if (current) return withAnotherAttempt(current, attempt, this.recorder.now());
    const order = await this.orders.findById(storeId, data.orderId);
    if (!order) return null;
    const base = {
      id: this.recorder.newId(),
      storeId,
      orderId: order.id,
      orderRef: order.ref,
      customerName: order.customer.name,
      wilayaCode: order.customer.wilayaCode,
      shipmentId: data.shipmentId,
      carrier: data.carrier,
      trackingNumber: data.trackingNumber,
    };
    return openFollowup(base, attempt, this.recorder.now());
  }
}
