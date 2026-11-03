import type { CarrierScore } from '@trackecom/contracts';

/** One carrier to one wilaya, as counted by the database. */
export interface ScoreRow {
  readonly carrier: string;
  readonly wilayaCode: number | null;
  readonly parcels: number;
  readonly delivered: number;
  readonly returned: number;
  /** Sum of hand-over-to-delivery days over delivered parcels, so lines can be added up. */
  readonly deliveryDays: number;
  readonly damaged: number;
  readonly lost: number;
  readonly claims: number;
  readonly claimsWon: number;
  readonly recovered: number;
}

type Counts = Omit<ScoreRow, 'carrier' | 'wilayaCode'>;
const COUNT_KEYS = [
  'parcels',
  'delivered',
  'returned',
  'deliveryDays',
  'damaged',
  'lost',
  'claims',
  'claimsWon',
  'recovered',
] as const satisfies readonly (keyof Counts)[];

const round = (value: number, digits: number) => Number(value.toFixed(digits));

export function toScore(row: ScoreRow): CarrierScore {
  const final = row.delivered + row.returned;
  const { deliveryDays, ...counts } = row;
  return {
    ...counts,
    deliveryRate: final === 0 ? null : round(row.delivered / final, 3),
    avgDeliveryDays: row.delivered === 0 ? null : round(deliveryDays / row.delivered, 1),
  };
}

/** Adds a carrier's wilaya lines into one store-wide line. */
export function storeWide(rows: readonly ScoreRow[]): ScoreRow[] {
  const totals = new Map<string, ScoreRow>();
  for (const row of rows) {
    const total = totals.get(row.carrier);
    if (!total) {
      totals.set(row.carrier, { ...row, wilayaCode: null });
      continue;
    }
    const sum = Object.fromEntries(COUNT_KEYS.map((key) => [key, total[key] + row[key]]));
    totals.set(row.carrier, { ...total, ...(sum as Counts) });
  }
  return [...totals.values()];
}

/** Best delivery rate first; a carrier with no final parcel yet goes last. */
export const byDeliveryRate = (a: CarrierScore, b: CarrierScore): number =>
  (b.deliveryRate ?? -1) - (a.deliveryRate ?? -1) || b.parcels - a.parcels;

/** Wilayas in code order (unknown destination last), carriers ranked inside each. */
export const byWilayaThenRate = (a: CarrierScore, b: CarrierScore): number =>
  (a.wilayaCode ?? 99) - (b.wilayaCode ?? 99) || byDeliveryRate(a, b);
