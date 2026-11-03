import type { ResellerStats } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import { looksRisky, portalPath, ratePercent } from './reseller-view';

const stats: ResellerStats = {
  orders: 20,
  delivered: 5,
  returned: 7,
  deliveryRate: 5 / 12,
  marginPending: 0,
  marginEarned: 0,
  marginPaid: 0,
};

describe('reseller view', () => {
  it('shows the rate in percent and flags a low rate only with enough orders', () => {
    expect(ratePercent(stats)).toBe(42);
    expect(looksRisky(stats)).toBe(true);
    expect(looksRisky({ ...stats, delivered: 2, returned: 3, deliveryRate: 0.4 })).toBe(false);
    expect(ratePercent({ ...stats, deliveryRate: null })).toBeNull();
  });

  it('builds the portal path', () => {
    expect(portalPath('abc')).toBe('/r/abc');
  });
});
