import type { MarginState, ResellerStats } from '@trackecom/contracts';

/** The reseller's portal path, under the current locale. */
export const portalPath = (portalCode: string): string => `/r/${portalCode}`;

/** "87 %" or null before the first final order. */
export const ratePercent = (stats: ResellerStats): number | null =>
  stats.deliveryRate === null ? null : Math.round(stats.deliveryRate * 100);

/** Under this delivery rate, with enough final orders, the supplier is told to look closer. */
const LOW_RATE = 0.6;
const MIN_FINAL = 10;

export const looksRisky = (stats: ResellerStats): boolean =>
  stats.deliveryRate !== null &&
  stats.delivered + stats.returned >= MIN_FINAL &&
  stats.deliveryRate < LOW_RATE;

export const MARGIN_BADGE: Readonly<
  Record<MarginState, 'neutral' | 'success' | 'info' | 'danger'>
> = {
  pending: 'neutral',
  earned: 'info',
  paid: 'success',
  void: 'danger',
};
