import { describe, expect, it } from 'vitest';
import { type BenchmarkRow, toLine } from './benchmark.js';

const row = (changes: Partial<BenchmarkRow>): BenchmarkRow => ({
  carrier: null,
  wilayaCode: 11,
  ownDelivered: 11,
  ownReturned: 9,
  ownDays: 44,
  otherStores: 6,
  otherDelivered: 70,
  otherReturned: 30,
  otherDays: 210,
  ...changes,
});

describe('toLine', () => {
  it('puts the store next to the other stores', () => {
    expect(toLine(row({}))).toEqual({
      wilayaCode: 11,
      carrier: null,
      own: { parcels: 20, deliveryRate: 0.55, avgDeliveryDays: 4 },
      market: { parcels: 100, deliveryRate: 0.7, avgDeliveryDays: 3 },
    });
  });

  it('hides the market when too few other stores or parcels contribute', () => {
    expect(toLine(row({ otherStores: 4 }))?.market).toBeNull();
    expect(toLine(row({ otherDelivered: 30, otherReturned: 19 }))?.market).toBeNull();
  });

  it('drops a line with nothing to show', () => {
    expect(toLine(row({ ownDelivered: 0, ownReturned: 0, otherStores: 2 }))).toBeNull();
  });
});
