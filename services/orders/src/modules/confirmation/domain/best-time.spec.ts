import { describe, expect, it } from 'vitest';
import { bestTime, hourlyRates, retryAt } from './best-time.js';

/** Customers answer far more in the evening than in the morning. */
const rows = [
  { hour: 10, attempts: 20, answered: 4 },
  { hour: 14, attempts: 20, answered: 8 },
  { hour: 19, attempts: 20, answered: 16 },
];
// 09:30 UTC is 10:30 in Algiers.
const morning = new Date('2026-11-01T09:30:00Z');

describe('hourlyRates', () => {
  it('pulls hours with few calls towards the overall rate', () => {
    const rates = hourlyRates([...rows, { hour: 8, attempts: 1, answered: 1 }]);

    expect(rates).toHaveLength(14);
    expect(rates.find((rate) => rate.hour === 8)?.rate).toBeCloseTo((1 + 0.475 * 5) / 6, 2);
    expect(rates.find((rate) => rate.hour === 12)).toMatchObject({ attempts: 0 });
  });
});

describe('bestTime', () => {
  it('finds the hour customers answer most', () => {
    const best = bestTime(rows, 'wilaya', morning);

    expect(best).toMatchObject({ bestHour: 19, basis: 'wilaya' });
    expect(best?.bestRate).toBeGreaterThan(0.7);
    expect(best?.rateNow).toBeLessThan(0.3);
  });

  it('needs enough calls in an hour, except for the customer themself', () => {
    const thin = [{ hour: 19, attempts: 2, answered: 2 }];

    expect(bestTime(thin, 'store', morning)).toBeNull();
    expect(bestTime(thin, 'customer', morning)?.bestHour).toBe(19);
  });
});

describe('retryAt', () => {
  it('moves the retry to the next best hour when it is clearly better', () => {
    expect(retryAt(bestTime(rows, 'wilaya', morning), morning)).toEqual(
      new Date('2026-11-01T18:00:00Z'),
    );
  });

  it('keeps the normal queue when the gain is small or the hour is now', () => {
    const flat = rows.map((row) => ({ ...row, answered: 10 }));
    expect(retryAt(bestTime(flat, 'wilaya', morning), morning)).toBeNull();

    const evening = new Date('2026-11-01T18:20:00Z');
    expect(retryAt(bestTime(rows, 'wilaya', evening), evening)).toBeNull();
  });
});
