import { describe, expect, it } from 'vitest';
import type { ParcelRecord } from '../application/ports/money.repository.js';
import { applyParcelStatus } from './parcel-lifecycle.js';

const parcel: ParcelRecord = {
  id: 'p1',
  storeId: 's1',
  carrier: 'yalidine',
  trackingNumber: 'yal-1',
  orderId: null,
  expectedCod: 3100,
  status: 'awaiting_delivery',
  deliveredAt: null,
  receivedCod: null,
  fees: 0,
  payoutId: null,
};
const at = new Date('2026-11-03T10:00:00Z');

describe('applyParcelStatus', () => {
  it('books the COD as owed when the parcel is delivered', () => {
    const move = applyParcelStatus(parcel, 'delivered', at);

    expect(move?.parcel).toMatchObject({ status: 'awaiting_payout', deliveredAt: at });
    expect(move?.postings).toEqual([
      { account: 'carrier_receivable', amount: 3100 },
      { account: 'cod_sales', amount: -3100 },
    ]);
  });

  it('expects nothing from a returned parcel', () => {
    expect(applyParcelStatus(parcel, 'returned', at)).toEqual({
      parcel: { ...parcel, status: 'returned' },
      postings: [],
    });
  });

  it('ignores scans in between and parcels already settled', () => {
    expect(applyParcelStatus(parcel, 'in_transit', at)).toBeNull();
    expect(applyParcelStatus({ ...parcel, status: 'matched' }, 'delivered', at)).toBeNull();
  });
});
