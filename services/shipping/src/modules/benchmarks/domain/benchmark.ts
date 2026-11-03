import {
  BENCHMARK_MIN_PARCELS,
  BENCHMARK_MIN_STORES,
  type BenchmarkLine,
  type DeliveryFigures,
} from '@trackecom/contracts';

/** Counts for one wilaya (carrier null) or one carrier to a wilaya, as the database adds them. */
export interface BenchmarkRow {
  readonly carrier: string | null;
  readonly wilayaCode: number | null;
  readonly ownDelivered: number;
  readonly ownReturned: number;
  readonly ownDays: number;
  /** Distinct other stores with a final parcel here. */
  readonly otherStores: number;
  readonly otherDelivered: number;
  readonly otherReturned: number;
  readonly otherDays: number;
}

const round = (value: number, digits: number) => Number(value.toFixed(digits));

function figures(delivered: number, returned: number, days: number): DeliveryFigures {
  const parcels = delivered + returned;
  return {
    parcels,
    deliveryRate: parcels === 0 ? null : round(delivered / parcels, 3),
    avgDeliveryDays: delivered === 0 ? null : round(days / delivered, 1),
  };
}

/** k-anonymity: enough other stores and parcels, or nothing is shown. */
export const isPublishable = (row: BenchmarkRow): boolean =>
  row.otherStores >= BENCHMARK_MIN_STORES &&
  row.otherDelivered + row.otherReturned >= BENCHMARK_MIN_PARCELS;

/** One line, or null when there is neither an own figure nor a publishable market figure. */
export function toLine(row: BenchmarkRow): BenchmarkLine | null {
  const ownParcels = row.ownDelivered + row.ownReturned;
  const market = isPublishable(row)
    ? figures(row.otherDelivered, row.otherReturned, row.otherDays)
    : null;
  if (ownParcels === 0 && !market) return null;
  return {
    wilayaCode: row.wilayaCode,
    carrier: row.carrier,
    own: ownParcels === 0 ? null : figures(row.ownDelivered, row.ownReturned, row.ownDays),
    market,
  };
}

/** Wilaya order, then the most-used carriers first. */
export const byWilaya = (a: BenchmarkLine, b: BenchmarkLine): number =>
  (a.wilayaCode ?? 99) - (b.wilayaCode ?? 99) || (b.own?.parcels ?? 0) - (a.own?.parcels ?? 0);
