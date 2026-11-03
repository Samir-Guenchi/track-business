import type { CarrierScore } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import { groupByWilaya, isThin, percent } from './scorecard-view';

const score = (
  carrier: string,
  wilayaCode: number | null,
  over: Partial<CarrierScore> = {},
): CarrierScore => ({
  carrier,
  wilayaCode,
  parcels: 12,
  delivered: 10,
  returned: 2,
  deliveryRate: 0.833,
  avgDeliveryDays: 2.5,
  damaged: 0,
  lost: 0,
  claims: 0,
  claimsWon: 0,
  recovered: 0,
  ...over,
});

describe('scorecard view', () => {
  it('groups ranked lines by wilaya without reordering them', () => {
    const groups = groupByWilaya([
      score('zr', 16),
      score('yalidine', 16),
      score('zr', 31),
      score('noest', null),
    ]);
    expect(groups.map((g) => [g.wilayaCode, g.scores.map((s) => s.carrier)])).toEqual([
      [16, ['zr', 'yalidine']],
      [31, ['zr']],
      [null, ['noest']],
    ]);
  });

  it('shows rates as whole percents and a dash without data', () => {
    expect(percent(0.833, 'en')).toBe('83%');
    expect(percent(null, 'en')).toBe('-');
  });

  it('flags carriers with too few final parcels to judge', () => {
    expect(isThin(score('zr', 16))).toBe(false);
    expect(isThin(score('zr', 16, { delivered: 3, returned: 1 }))).toBe(true);
  });
});
