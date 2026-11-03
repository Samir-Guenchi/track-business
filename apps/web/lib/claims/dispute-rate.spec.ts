import { describe, expect, it } from 'vitest';
import { disputeRate } from './dispute-rate';

describe('disputeRate', () => {
  it('rounds to whole percent', () => {
    expect(disputeRate({ answered: 3, disputed: 1 })).toBe(33);
  });

  it('is unknown without answers', () => {
    expect(disputeRate({ answered: 0, disputed: 0 })).toBeNull();
  });
});
