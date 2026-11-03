import type { DeliveryType, ExpectedFeesResponse } from '@trackecom/contracts';

export interface RateRow {
  readonly fromWilaya: number;
  readonly toWilaya: number;
  readonly deliveryType: string;
  readonly price: number;
  readonly returnFee: number;
}

export interface ParcelRoute {
  readonly trackingNumber: string;
  readonly toWilayaCode: number | null;
  readonly deliveryType: DeliveryType | null;
}

/** One value when every candidate row agrees on it, null otherwise (no row, or rows differ). */
function agreed(values: readonly number[]): number | null {
  const [first] = values;
  return first !== undefined && values.every((value) => value === first) ? first : null;
}

/**
 * What the rate card says one parcel should cost. The store's origin wilaya is not known here
 * yet (#160 follow-up), so rows from every origin are candidates: a price counts only when they
 * agree, which is the usual case of a store shipping from one place.
 */
export function expectedFees(
  route: ParcelRoute,
  card: readonly RateRow[],
): ExpectedFeesResponse['items'][number] {
  const rows = card.filter(
    (row) => row.toWilaya === route.toWilayaCode && row.deliveryType === route.deliveryType,
  );
  return {
    ...route,
    deliveryFee: agreed(rows.map((row) => row.price)),
    returnFee: agreed(rows.map((row) => row.returnFee)),
  };
}
