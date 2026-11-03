import { type StuckParcel, STUCK_AFTER_DELIVERY_DAYS } from '@trackecom/contracts';

export type StuckLevel = 'stuck' | 'late';

/**
 * A parcel idle for twice its status's limit or more is "late": the seller should call the
 * carrier now. Below that it is only "stuck": worth a look today.
 */
export function stuckLevel(parcel: Pick<StuckParcel, 'status' | 'idleDays'>): StuckLevel {
  const limit = STUCK_AFTER_DELIVERY_DAYS[parcel.status];
  if (limit === undefined) return 'stuck';
  return parcel.idleDays >= limit * 2 ? 'late' : 'stuck';
}

/** The carriers present in a list, sorted, each once (for the filter). */
export function carriersOf(items: readonly Pick<StuckParcel, 'carrier'>[]): string[] {
  return [...new Set(items.map((item) => item.carrier))].sort();
}
