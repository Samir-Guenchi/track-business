import { describe, expect, it } from 'vitest';
import { type KnownParcel, sortBatch } from './return-batch.js';
import { daysWaiting, overdueCutoff } from './return-window.js';

const parcel = (trackingNumber: string, extra: Partial<KnownParcel> = {}): KnownParcel => ({
  shipmentId: `s-${trackingNumber}`,
  orderId: `o-${trackingNumber}`,
  trackingNumber,
  status: 'returned',
  collectsExchange: false,
  alreadyReceived: false,
  ...extra,
});
const known = (...parcels: KnownParcel[]) => new Map(parcels.map((p) => [p.trackingNumber, p]));
const scan = (trackingNumber: string) => ({ trackingNumber, condition: 'intact' as const });

describe('sortBatch', () => {
  it('receives known parcels and flags unknown numbers', () => {
    const sort = sortBatch([scan('A1'), scan('ZZ')], known(parcel('A1')));
    expect(sort.received.map((r) => r.trackingNumber)).toEqual(['A1']);
    expect(sort.received[0]?.unannounced).toBe(false);
    expect(sort.unknown).toEqual(['ZZ']);
  });

  it('counts a number scanned twice once', () => {
    const sort = sortBatch([scan('A1'), scan('A1')], known(parcel('A1')));
    expect(sort.received).toHaveLength(1);
  });

  it('does not receive a parcel twice', () => {
    const sort = sortBatch([scan('A1')], known(parcel('A1', { alreadyReceived: true })));
    expect(sort.received).toEqual([]);
    expect(sort.alreadyReceived).toEqual(['A1']);
  });

  it('marks a parcel the carrier never announced as returning', () => {
    const sort = sortBatch([scan('A1')], known(parcel('A1', { status: 'in_transit' })));
    expect(sort.received[0]?.unannounced).toBe(true);
  });

  it("expects a delivered exchange's old items back (#138)", () => {
    const exchange = parcel('E1', { status: 'delivered', collectsExchange: true });
    const sort = sortBatch([scan('E1')], known(exchange));
    expect(sort.received[0]?.unannounced).toBe(false);
  });

  it('lists declared numbers that were not handed over', () => {
    const sort = sortBatch([scan('A1')], known(parcel('A1')), ['A1', 'B2', 'B2']);
    expect(sort.missing).toEqual(['B2']);
  });
});

describe('return window', () => {
  const now = new Date('2026-11-20T12:00:00Z');

  it('counts whole days since the return was announced', () => {
    expect(daysWaiting(new Date('2026-11-10T13:00:00Z'), now)).toBe(9);
    expect(daysWaiting(new Date('2026-11-21T00:00:00Z'), now)).toBe(0);
  });

  it('puts the overdue cutoff N days back', () => {
    expect(overdueCutoff(now, 10).toISOString()).toBe('2026-11-10T12:00:00.000Z');
  });
});
