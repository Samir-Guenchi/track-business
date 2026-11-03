import { describe, expect, it } from 'vitest';
import { carriersOf, stuckLevel } from './stuck-view';

describe('stuckLevel', () => {
  it('is stuck below twice the limit and late from there', () => {
    expect(stuckLevel({ status: 'in_transit', idleDays: 3 })).toBe('stuck');
    expect(stuckLevel({ status: 'in_transit', idleDays: 6 })).toBe('late');
    expect(stuckLevel({ status: 'out_for_delivery', idleDays: 2 })).toBe('late');
  });

  it('treats a status without a limit as only stuck', () => {
    expect(stuckLevel({ status: 'delivered', idleDays: 30 })).toBe('stuck');
  });
});

describe('carriersOf', () => {
  it('lists each carrier once, sorted', () => {
    const items = [{ carrier: 'zr' }, { carrier: 'yalidine' }, { carrier: 'zr' }];
    expect(carriersOf(items)).toEqual(['yalidine', 'zr']);
  });
});
