import {
  type ParcelStatus,
  STUCK_AFTER_DELIVERY_DAYS,
  type StuckParcel,
  type StuckParcelsResponse,
} from '@trackecom/contracts';
import { deliveryDaysBetween } from '../../eta/domain/algeria-calendar.js';

/** Three parcels stuck with one carrier in one wilaya point at the carrier, not at the parcel. */
export const HOTSPOT_MIN_PARCELS = 3;

export interface OpenParcel {
  readonly shipmentId: string;
  readonly orderId: string;
  readonly carrier: string;
  readonly trackingNumber: string;
  readonly toWilayaCode: number | null;
  readonly status: ParcelStatus;
  readonly lastMoveAt: Date;
}

/** The parcel as stuck, or null while it is within its status's allowance. */
export function asStuck(parcel: OpenParcel, now: Date): StuckParcel | null {
  const allowance = STUCK_AFTER_DELIVERY_DAYS[parcel.status];
  if (allowance === undefined) return null;
  const idleDays = deliveryDaysBetween(parcel.lastMoveAt, now);
  if (idleDays <= allowance) return null;
  return { ...parcel, lastMoveAt: parcel.lastMoveAt.toISOString(), idleDays };
}

export function hotspots(stuck: readonly StuckParcel[]): StuckParcelsResponse['hotspots'] {
  const counts = new Map<string, StuckParcelsResponse['hotspots'][number]>();
  for (const parcel of stuck) {
    const key = `${parcel.carrier}:${parcel.toWilayaCode ?? '-'}`;
    const current = counts.get(key) ?? {
      carrier: parcel.carrier,
      toWilayaCode: parcel.toWilayaCode,
      count: 0,
    };
    counts.set(key, { ...current, count: current.count + 1 });
  }
  return [...counts.values()]
    .filter((spot) => spot.count >= HOTSPOT_MIN_PARCELS)
    .sort((a, b) => b.count - a.count);
}

/** Stuck parcels, longest idle first, with their hotspots. */
export function stuckReport(parcels: readonly OpenParcel[], now: Date): StuckParcelsResponse {
  const items = parcels
    .map((parcel) => asStuck(parcel, now))
    .filter((parcel): parcel is StuckParcel => parcel !== null)
    .sort((a, b) => b.idleDays - a.idleDays);
  return { items, hotspots: hotspots(items) };
}
