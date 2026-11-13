import { describe, expect, it } from 'vitest';
import { codeMatches, isDroppable, monthRange, newPickupCode } from './pickup-code.js';

describe('pickup code', () => {
  it('is six digits and compared exactly', () => {
    expect(newPickupCode()).toMatch(/^\d{6}$/);
    expect(codeMatches('012345', '012345')).toBe(true);
    expect(codeMatches('012345', '12345')).toBe(false);
  });

  it('accepts only parcels still on their way', () => {
    expect(isDroppable('in_transit')).toBe(true);
    expect(isDroppable('delivered')).toBe(false);
  });

  it('counts a month in Algiers time', () => {
    const { from, to } = monthRange('2026-12');
    expect(from.toISOString()).toBe('2026-11-30T23:00:00.000Z');
    expect(to.toISOString()).toBe('2026-12-31T23:00:00.000Z');
  });
});
