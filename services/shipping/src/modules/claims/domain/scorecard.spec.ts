import { describe, expect, it } from 'vitest';
import {
  byDeliveryRate,
  byWilayaThenRate,
  type ScoreRow,
  storeWide,
  toScore,
} from './scorecard.js';

const row = (
  carrier: string,
  wilayaCode: number | null,
  over: Partial<ScoreRow> = {},
): ScoreRow => ({
  carrier,
  wilayaCode,
  parcels: 10,
  delivered: 8,
  returned: 2,
  deliveryDays: 24,
  damaged: 0,
  lost: 0,
  claims: 0,
  claimsWon: 0,
  recovered: 0,
  ...over,
});

describe('carrier scorecard', () => {
  it('turns counts into a delivery rate and average days', () => {
    expect(toScore(row('yalidine', 16))).toMatchObject({ deliveryRate: 0.8, avgDeliveryDays: 3 });
    const fresh = toScore(row('zr', 16, { delivered: 0, returned: 0, deliveryDays: 0 }));
    expect(fresh).toMatchObject({ deliveryRate: null, avgDeliveryDays: null });
    expect(fresh).not.toHaveProperty('deliveryDays');
  });

  it('adds wilaya lines into one line per carrier', () => {
    const totals = storeWide([
      row('yalidine', 16, { claims: 1, claimsWon: 1, recovered: 3000 }),
      row('yalidine', 31, { delivered: 2, returned: 8, deliveryDays: 10 }),
    ]);
    expect(totals).toHaveLength(1);
    const total = totals[0] ?? row('missing', null);
    expect(total).toMatchObject({ wilayaCode: null, parcels: 20, delivered: 10, returned: 10 });
    expect(toScore(total)).toMatchObject({
      deliveryRate: 0.5,
      avgDeliveryDays: 3.4,
      recovered: 3000,
    });
  });

  it('ranks by delivery rate inside each wilaya', () => {
    const scores = [
      toScore(row('zr', 31)),
      toScore(row('yalidine', 16, { delivered: 5, returned: 5 })),
      toScore(row('maystro', 16)),
      toScore(row('noest', null)),
    ].sort(byWilayaThenRate);
    expect(scores.map((s) => `${s.wilayaCode}:${s.carrier}`)).toEqual([
      '16:maystro',
      '16:yalidine',
      '31:zr',
      'null:noest',
    ]);
    const empty = toScore(row('new', 16, { delivered: 0, returned: 0 }));
    expect([empty, toScore(row('zr', 16))].sort(byDeliveryRate)[1]).toBe(empty);
  });
});
