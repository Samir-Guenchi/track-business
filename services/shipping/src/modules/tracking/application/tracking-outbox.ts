import {
  type ShipmentStatusChangedEvent,
  TRACKING_EVENTS,
  type UnknownCarrierStatusEvent,
} from '@trackecom/contracts';
import type { TimelinePlan } from '../domain/timeline.js';
import { type OutboxMessage, outboxMessage } from '../../../shared/outbox-message.js';
import type { ShipmentRecord } from './ports/tracking.repository.js';

interface Context {
  readonly shipment: ShipmentRecord;
  readonly correlationId: string;
  readonly now: Date;
}

const message = (ctx: Context, type: string, data: unknown): OutboxMessage =>
  outboxMessage({ ...ctx, storeId: ctx.shipment.storeId }, type, data);

/** The domain events a timeline change publishes: status changes, then unmapped carrier labels. */
export function trackingOutbox(ctx: Context, plan: TimelinePlan): OutboxMessage[] {
  const { shipment } = ctx;
  const changes = plan.transitions.map((transition) => {
    const data: ShipmentStatusChangedEvent = {
      shipmentId: shipment.id,
      orderId: shipment.orderId,
      carrier: shipment.carrier,
      trackingNumber: shipment.trackingNumber,
      from: transition.from,
      to: transition.to,
      failureReason: transition.failureReason,
      at: transition.at.toISOString(),
    };
    return message(ctx, TRACKING_EVENTS.statusChanged, data);
  });
  const unknown = plan.unknownStatuses.map((carrierStatus) => {
    const data: UnknownCarrierStatusEvent = {
      carrier: shipment.carrier,
      carrierStatus,
      shipmentId: shipment.id,
    };
    return message(ctx, TRACKING_EVENTS.unknownCarrierStatus, data);
  });
  return [...changes, ...unknown];
}
