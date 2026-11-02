import { addDeliveryDays, deliveryDaysBetween } from './algeria-calendar.js';

/** Past parcels: when the carrier took them, and when they were delivered. */
export interface TransitSample {
  readonly startedAt: Date;
  readonly deliveredAt: Date;
}

/** A range of delivery days after hand-over: most parcels arrive within it. */
export interface TransitRange {
  readonly low: number;
  readonly high: number;
  readonly sample: number;
}

/** Below this many past parcels a range is not trusted. */
export const MIN_SAMPLE = 20;
/** Wider ranges ("in 1 to 6 days") help nobody, so they are not shown. */
export const MAX_RANGE_WIDTH = 2;
/** The range covers the middle 80% of past parcels (#55 target: 80% inside). */
const LOW_QUANTILE = 0.1;
const HIGH_QUANTILE = 0.9;

const quantile = (sorted: readonly number[], q: number): number =>
  sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0;

/** The transit range learnt from past parcels, or null when it is not confident enough. */
export function transitRange(samples: readonly TransitSample[]): TransitRange | null {
  if (samples.length < MIN_SAMPLE) return null;
  const days = samples
    .map((sample) => deliveryDaysBetween(sample.startedAt, sample.deliveredAt))
    .sort((a, b) => a - b);
  const low = quantile(days, LOW_QUANTILE);
  const high = quantile(days, HIGH_QUANTILE);
  return high - low > MAX_RANGE_WIDTH ? null : { low, high, sample: samples.length };
}

/** Calendar dates (YYYY-MM-DD, Algiers) between which the parcel should arrive. */
export interface Eta {
  readonly earliest: string;
  readonly latest: string;
}

/**
 * The ETA of a parcel handed over at `startedAt`. A date already past moves to the next delivery
 * day, so a late parcel still shows "today or tomorrow" rather than a date gone by.
 */
export function predictEta(range: TransitRange, startedAt: Date, now: Date): Eta {
  const late = deliveryDaysBetween(startedAt, now);
  const earliest = addDeliveryDays(startedAt, Math.max(range.low, late));
  const latest = addDeliveryDays(startedAt, Math.max(range.high, late + 1));
  return { earliest: dateOnly(earliest), latest: dateOnly(latest) };
}

const dateOnly = (day: Date): string => day.toISOString().slice(0, 10);

/** Share of delivered parcels whose day fell inside their predicted range (accuracy check). */
export function shareInsideRange(
  outcomes: readonly { readonly eta: Eta; readonly deliveredOn: string }[],
): number {
  if (outcomes.length === 0) return 0;
  const inside = outcomes.filter(
    ({ eta, deliveredOn }) => deliveredOn >= eta.earliest && deliveredOn <= eta.latest,
  );
  return inside.length / outcomes.length;
}
