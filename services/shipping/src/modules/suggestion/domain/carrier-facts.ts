/** What we know about one connected carrier for one destination. */
export interface CarrierFacts {
  readonly carrier: string;
  /** Rate-card cost for this route and delivery type; null without a rate. */
  readonly cost: number | null;
  /** This store's final parcels to the destination wilaya (last 90 days). */
  readonly store: { readonly delivered: number; readonly returned: number };
  /** Delivered share across all stores; null when too few stores shipped there. */
  readonly networkRate: number | null;
  /** Average days from creation to delivery, store first, network as fallback. */
  readonly averageDays: number | null;
  /** Stop desks in the wilaya: null when the carrier publishes none anywhere (unknown). */
  readonly stopDesk: boolean | null;
}

/** Without any data a carrier is assumed to deliver this share (Algerian COD average). */
export const DEFAULT_DELIVERY_RATE = 0.8;
/** How many parcels the prior is worth: a store's own record takes over after a few dozen. */
const PRIOR_WEIGHT = 10;

/** The store's own record, pulled towards the network rate while it has few parcels. */
export function reliability(facts: CarrierFacts): number {
  const prior = facts.networkRate ?? DEFAULT_DELIVERY_RATE;
  const total = facts.store.delivered + facts.store.returned;
  return (facts.store.delivered + PRIOR_WEIGHT * prior) / (total + PRIOR_WEIGHT);
}

export const storeRate = (facts: CarrierFacts): number | null => {
  const total = facts.store.delivered + facts.store.returned;
  return total === 0 ? null : facts.store.delivered / total;
};

/** 1 for the best value, falling towards 0 as a value gets further from it (lower is better). */
export const relativeToBest = (value: number, best: number): number => (best + 1) / (value + 1);
