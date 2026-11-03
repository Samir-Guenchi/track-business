import { describe, expect, it } from 'vitest';
import { verdict } from './benchmark-view';

const figures = (deliveryRate: number | null) => ({
  parcels: 60,
  deliveryRate,
  avgDeliveryDays: 3,
});

describe('verdict', () => {
  it('flags a gap of ten points or more', () => {
    expect(verdict({ own: figures(0.55), market: figures(0.7) })).toBe('below');
    expect(verdict({ own: figures(0.85), market: figures(0.7) })).toBe('above');
    expect(verdict({ own: figures(0.65), market: figures(0.7) })).toBe('close');
  });

  it('says nothing without both rates', () => {
    expect(verdict({ own: figures(0.5), market: null })).toBeNull();
    expect(verdict({ own: null, market: figures(0.7) })).toBeNull();
  });
});
