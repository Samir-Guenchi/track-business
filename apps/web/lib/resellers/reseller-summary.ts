import type { Reseller } from '@trackecom/contracts';

/** Store-wide numbers for the supplier's reseller deck. */
export interface ResellerSummary {
  readonly count: number;
  readonly active: number;
  readonly orders: number;
  readonly delivered: number;
  readonly returned: number;
  readonly finalOrders: number;
  readonly deliveryRate: number | null;
  readonly marginPending: number;
  readonly marginEarned: number;
}

const EMPTY_TOTALS = {
  active: 0,
  orders: 0,
  delivered: 0,
  returned: 0,
  marginPending: 0,
  marginEarned: 0,
};

/** Sums a store's resellers; the delivery rate stays null until a final order exists. */
export function summariseResellers(items: readonly Reseller[]): ResellerSummary {
  const totals = items.reduce(
    (sum, { active, stats }) => ({
      active: sum.active + (active ? 1 : 0),
      orders: sum.orders + stats.orders,
      delivered: sum.delivered + stats.delivered,
      returned: sum.returned + stats.returned,
      marginPending: sum.marginPending + stats.marginPending,
      marginEarned: sum.marginEarned + stats.marginEarned,
    }),
    EMPTY_TOTALS,
  );
  const finalOrders = totals.delivered + totals.returned;
  return {
    count: items.length,
    ...totals,
    finalOrders,
    deliveryRate: finalOrders === 0 ? null : totals.delivered / finalOrders,
  };
}
