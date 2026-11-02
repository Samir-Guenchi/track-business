import { Injectable } from '@nestjs/common';
import {
  type EventEnvelope,
  ORDER_STATUS_FOR_PARCEL,
  type ShipmentCreatedEvent,
  ShipmentCreatedEventSchema,
  ShipmentFailedEventSchema,
  ShipmentStatusChangedEventSchema,
} from '@trackecom/contracts';
import { type ApplyResult, SystemStatusChange } from './system-status-change.js';

/**
 * Orders follow their parcels (#32): a created parcel ships the order, a refused one sends it
 * back to `confirmed` with the reason, and carrier scans move it along the status machine.
 */
@Injectable()
export class ApplyShipmentStatusUseCase {
  constructor(private readonly change: SystemStatusChange) {}

  async execute(event: EventEnvelope): Promise<ApplyResult> {
    const data = ShipmentStatusChangedEventSchema.parse(event.data);
    const to = ORDER_STATUS_FOR_PARCEL[data.to];
    if (!to) return 'ignored';
    const reason = data.failureReason ? `${data.carrier}: ${data.failureReason}` : data.carrier;
    return this.change.apply(event, {
      orderId: data.orderId,
      to,
      reason,
      audit: { shipmentId: data.shipmentId },
    });
  }

  created(event: EventEnvelope): Promise<ApplyResult> {
    const data: ShipmentCreatedEvent = ShipmentCreatedEventSchema.parse(event.data);
    return this.change.apply(event, {
      orderId: data.orderId,
      to: 'shipped',
      reason: `${data.carrier} ${data.trackingNumber}`,
      fields: { carrier: data.carrier, trackingNumber: data.trackingNumber },
      audit: { shipmentId: data.shipmentId },
    });
  }

  failed(event: EventEnvelope): Promise<ApplyResult> {
    const data = ShipmentFailedEventSchema.parse(event.data);
    return this.change.apply(event, {
      orderId: data.orderId,
      to: 'confirmed',
      reason: `${data.carrier}: ${data.reason}`,
      audit: { shipFailure: data.message },
    });
  }
}
