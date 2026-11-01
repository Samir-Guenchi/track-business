import type {
  OrderTrackingResponse,
  PublicTrackingResponse,
  TrackingEvent,
} from '@trackecom/contracts';
import type { TrackingEventRecord } from '../application/ports/tracking.repository.js';
import type { TimelineWithEta } from '../application/tracking-query.service.js';

const toEventDto = (event: TrackingEventRecord): TrackingEvent => ({
  id: event.id,
  status: event.status,
  carrierStatus: event.carrierStatus,
  location: event.location,
  note: event.note,
  failureReason: event.failureReason,
  at: event.at.toISOString(),
});

export const toOrderTracking = (timelines: readonly TimelineWithEta[]): OrderTrackingResponse => ({
  items: timelines.map(({ shipment, events, eta }) => ({
    shipment: {
      id: shipment.id,
      orderId: shipment.orderId,
      carrier: shipment.carrier,
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      lastEventAt: shipment.lastEventAt?.toISOString() ?? null,
      publicCode: shipment.publicCode,
      eta,
    },
    events: events.map(toEventDto),
  })),
});

/** Customer view: statuses, places and times only. Carrier notes may name people or phones. */
export const toPublicTracking = ({
  shipment,
  events,
  eta,
}: TimelineWithEta): PublicTrackingResponse => ({
  status: shipment.status,
  carrier: shipment.carrier,
  trackingNumber: shipment.trackingNumber,
  eta,
  events: events.flatMap((event) =>
    event.status
      ? [{ status: event.status, location: event.location, at: event.at.toISOString() }]
      : [],
  ),
});
