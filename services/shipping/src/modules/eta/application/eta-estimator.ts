import { Inject, Injectable } from '@nestjs/common';
import type { Eta, ParcelStatus } from '@trackecom/contracts';
import type { ShipmentTimeline } from '../../tracking/application/ports/tracking.repository.js';
import { type TransitRange, predictEta, transitRange } from '../domain/eta.js';
import { TRANSIT_SAMPLES, type TransitSamples } from './transit-samples.port.js';

/** Statuses that mean the carrier has the parcel and it is on its way. */
const MOVING: readonly ParcelStatus[] = [
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'failed_attempt',
];
/** Transit times change slowly; a route's range is recomputed at most hourly per replica. */
const CACHE_MS = 3_600_000;
const HISTORY_MS = 90 * 86_400_000;

interface Cached {
  readonly range: TransitRange | null;
  readonly until: number;
}

/** The ETA shown on the tracking page and the order detail (#55). */
@Injectable()
export class EtaEstimator {
  private readonly cache = new Map<string, Cached>();

  constructor(@Inject(TRANSIT_SAMPLES) private readonly samples: TransitSamples) {}

  async forTimeline({ shipment, events }: ShipmentTimeline, now: Date): Promise<Eta | null> {
    if (!MOVING.includes(shipment.status) || shipment.toWilayaCode === null) return null;
    const handedOver = events
      .filter((event) => event.status === 'picked_up' || event.status === 'in_transit')
      .reduce<Date | null>((first, event) => (first && first < event.at ? first : event.at), null);
    const range = await this.rangeFor(shipment.carrier, shipment.toWilayaCode, now);
    return range ? predictEta(range, handedOver ?? shipment.createdAt, now) : null;
  }

  private async rangeFor(carrier: string, wilayaCode: number, now: Date) {
    const key = `${carrier}:${wilayaCode}`;
    const cached = this.cache.get(key);
    if (cached && cached.until > now.getTime()) return cached.range;
    const since = new Date(now.getTime() - HISTORY_MS);
    const range = transitRange(await this.samples.forRoute({ carrier, wilayaCode, since }));
    this.cache.set(key, { range, until: now.getTime() + CACHE_MS });
    return range;
  }
}
