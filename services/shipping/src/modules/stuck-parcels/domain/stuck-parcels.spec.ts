import { describe, expect, it } from 'vitest';
import { type OpenParcel, asStuck, stuckReport } from './stuck-parcels.js';

// Tuesday 10 November 2026, Algiers.
const now = new Date('2026-11-10T10:00:00Z');
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000);
const parcel = (overrides: Partial<OpenParcel> = {}): OpenParcel => ({
  shipmentId: '19700000-0000-4000-8000-000000000001',
  orderId: '19700000-0000-4000-8000-000000000002',
  carrier: 'yalidine',
  trackingNumber: 'T1',
  toWilayaCode: 31,
  status: 'in_transit',
  lastMoveAt: daysAgo(6),
  ...overrides,
});

describe('stuck parcels', () => {
  it('counts delivery days only: Friday does not make a parcel stuck', () => {
    // Saturday 7 -> Tuesday 10: Sun, Mon, Tue = 3 delivery days, the in-transit allowance.
    expect(asStuck(parcel({ lastMoveAt: new Date('2026-11-07T10:00:00Z') }), now)).toBeNull();
    // Thursday 5 -> Tuesday 10 skips Friday 6: 4 delivery days.
    expect(asStuck(parcel({ lastMoveAt: new Date('2026-11-05T10:00:00Z') }), now)?.idleDays).toBe(
      4,
    );
  });

  it('gives an out-for-delivery parcel one day and never flags a delivered one', () => {
    expect(
      asStuck(parcel({ status: 'out_for_delivery', lastMoveAt: daysAgo(2) }), now),
    ).not.toBeNull();
    expect(asStuck(parcel({ status: 'delivered', lastMoveAt: daysAgo(60) }), now)).toBeNull();
  });

  it('sorts longest idle first and finds carrier x wilaya hotspots', () => {
    const parcels = [
      parcel({ trackingNumber: 'A', lastMoveAt: daysAgo(8) }),
      parcel({ trackingNumber: 'B' }),
      parcel({ trackingNumber: 'C' }),
      parcel({ trackingNumber: 'D', carrier: 'zr', toWilayaCode: 16 }),
    ];
    const report = stuckReport(parcels, now);

    expect(report.items[0]?.trackingNumber).toBe('A');
    expect(report.hotspots).toEqual([{ carrier: 'yalidine', toWilayaCode: 31, count: 3 }]);
  });
});
