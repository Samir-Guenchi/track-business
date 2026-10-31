import type { FailedAttemptReason, ParcelStatus } from '@trackecom/contracts';
import type {
  ShipmentRecord,
  ShipmentTimeline,
  TrackingEventRecord,
} from '../application/ports/tracking.repository.js';

/** Columns are plain text; values were validated against the contract enums on the way in. */
interface ShipmentRow {
  id: string;
  storeId: string;
  orderId: string;
  carrier: string;
  trackingNumber: string;
  status: string;
  publicCode: string;
  lastEventAt: Date | null;
}

interface EventRow {
  id: string;
  status: string | null;
  carrierStatus: string;
  location: string | null;
  note: string | null;
  failureReason: string | null;
  at: Date;
}

export const toShipment = (row: ShipmentRow): ShipmentRecord => ({
  id: row.id,
  storeId: row.storeId,
  orderId: row.orderId,
  carrier: row.carrier,
  trackingNumber: row.trackingNumber,
  status: row.status as ParcelStatus,
  publicCode: row.publicCode,
  lastEventAt: row.lastEventAt,
});

export const toEvent = (row: EventRow): TrackingEventRecord => ({
  id: row.id,
  status: row.status as ParcelStatus | null,
  carrierStatus: row.carrierStatus,
  location: row.location,
  note: row.note,
  failureReason: row.failureReason as FailedAttemptReason | null,
  at: row.at,
});

export const toTimeline = (row: ShipmentRow & { events: EventRow[] }): ShipmentTimeline => ({
  shipment: toShipment(row),
  events: row.events.map(toEvent),
});

export const NEWEST_EVENTS_FIRST = {
  events: { orderBy: [{ at: 'desc' as const }, { receivedAt: 'desc' as const }] },
};
