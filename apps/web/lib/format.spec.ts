import { describe, expect, it } from 'vitest';
import { formatDate, formatDzd, formatNumber } from './format';

describe('format', () => {
  it('keeps Latin digits in Arabic', () => {
    expect(formatNumber(12500, 'ar')).toMatch(/12.500/u);
  });

  it('formats dinars without decimals in every locale', () => {
    for (const locale of ['ar', 'fr', 'en'] as const) {
      const text = formatDzd(1990.4, locale);
      expect(text).toMatch(/1.?990/u);
      expect(text).not.toMatch(/[.,]40?\b/u);
    }
  });

  it('formats dates in the Algiers time zone', () => {
    // 23:30 UTC on 31 Dec is already 1 January in Algiers (UTC+1).
    expect(formatDate(new Date('2026-12-31T23:30:00Z'), 'en')).toMatch(/Jan 1, 2027/u);
  });
});
