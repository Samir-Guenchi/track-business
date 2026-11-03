import { describe, expect, it } from 'vitest';
import { nextCode, toCreateSession } from './session-draft';

describe('session draft', () => {
  it('suggests the next free code', () => {
    expect(nextCode([])).toBe('A1');
    expect(nextCode([{ code: 'A1' }, { code: 'a2' }])).toBe('A3');
  });

  it('drops rows without a name and upper-cases codes', () => {
    const rows = [
      { key: 1, code: 'a1', name: 'Robe', unitPrice: 2900 },
      { key: 2, code: 'A2', name: ' ', unitPrice: 0 },
    ];
    expect(toCreateSession(' Live ', rows)).toEqual({
      title: 'Live',
      products: [{ code: 'A1', name: 'Robe', unitPrice: 2900 }],
    });
  });
});
