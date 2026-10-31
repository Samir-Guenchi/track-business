import { describe, expect, it } from 'vitest';
import { kindForStatus } from './carrier.errors.js';
import { statusMapper } from './status-map.js';

describe('statusMapper', () => {
  const map = statusMapper({ Livré: 'delivered', 'En cours de livraison': 'out_for_delivery' });

  it('ignores case, accents and spacing', () => {
    expect(map(' LIVRE ')).toBe('delivered');
    expect(map('en  cours de livraison')).toBe('out_for_delivery');
  });

  it('returns null for labels nobody mapped yet', () => {
    expect(map('Bloqué au hub')).toBeNull();
  });
});

describe('kindForStatus', () => {
  it('maps HTTP statuses onto error kinds', () => {
    expect([401, 404, 422, 429, 503].map(kindForStatus)).toEqual([
      'auth',
      'not_found',
      'validation',
      'rate_limited',
      'unavailable',
    ]);
  });
});
