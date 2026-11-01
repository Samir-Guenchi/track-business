import { describe, expect, it } from 'vitest';
import { addDeliveryDays, deliveryDaysBetween, isDeliveryDay } from './algeria-calendar.js';
import { predictEta, shareInsideRange, transitRange } from './eta.js';

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

describe('Algeria delivery calendar', () => {
  it('skips Fridays and public holidays', () => {
    expect(isDeliveryDay(day('2026-11-06'))).toBe(false); // Friday
    expect(isDeliveryDay(day('2026-11-01'))).toBe(false); // Revolution Day
    expect(isDeliveryDay(day('2026-11-07'))).toBe(true); // Saturday
  });

  it('counts delivery days between two instants', () => {
    // Wed 4 Nov -> Sat 7 Nov: Thursday and Saturday (Friday skipped).
    expect(deliveryDaysBetween(day('2026-11-04'), day('2026-11-07'))).toBe(2);
    expect(addDeliveryDays(day('2026-11-04'), 2)).toEqual(day('2026-11-07'));
  });

  it('uses the Algiers date, not the UTC one', () => {
    // 23:30 UTC on Wednesday is already Thursday in Algiers.
    expect(deliveryDaysBetween(new Date('2026-11-04T23:30:00Z'), day('2026-11-05'))).toBe(0);
  });
});

const samples = (days: readonly number[]) =>
  days.map((count) => ({
    startedAt: day('2026-10-03'),
    deliveredAt: addDeliveryDays(day('2026-10-03'), count),
  }));

describe('transitRange', () => {
  it('covers the middle 80% of past parcels', () => {
    const past = samples([...Array(4).fill(1), ...Array(12).fill(2), ...Array(4).fill(3)]);
    expect(transitRange(past)).toEqual({ low: 1, high: 3, sample: 20 });
  });

  it('is not confident with few parcels or a wide spread', () => {
    expect(transitRange(samples(Array(19).fill(2)))).toBeNull();
    const spread = samples([...Array(10).fill(1), ...Array(10).fill(6)]);
    expect(transitRange(spread)).toBeNull();
  });
});

describe('predictEta', () => {
  const range = { low: 1, high: 3, sample: 40 };

  it('gives the day range from hand-over', () => {
    // Handed over Wed 4 Nov: 1 to 3 delivery days -> Thu 5 to Sun 8 (Friday skipped).
    const eta = predictEta(range, day('2026-11-04'), day('2026-11-04'));
    expect(eta).toEqual({ earliest: '2026-11-05', latest: '2026-11-08' });
  });

  it('never shows a date already past', () => {
    const eta = predictEta(range, day('2026-11-04'), day('2026-11-10'));
    expect(eta).toEqual({ earliest: '2026-11-10', latest: '2026-11-11' });
  });
});

describe('shareInsideRange', () => {
  it('measures the share of parcels delivered inside their range', () => {
    const eta = { earliest: '2026-11-05', latest: '2026-11-07' };
    const outcomes = [
      { eta, deliveredOn: '2026-11-05' },
      { eta, deliveredOn: '2026-11-07' },
      { eta, deliveredOn: '2026-11-09' },
      { eta, deliveredOn: '2026-11-06' },
    ];
    expect(shareInsideRange(outcomes)).toBe(0.75);
  });
});
