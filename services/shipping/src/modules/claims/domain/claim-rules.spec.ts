import { describe, expect, it } from 'vitest';
import { openingRefusal, stampsFor, transitionRefusal } from './claim-rules.js';

describe('claim rules', () => {
  it('refuses a claim on a parcel the carrier never had', () => {
    expect(openingRefusal('created')).toBe('not_handed_over');
    expect(openingRefusal('cancelled')).toBe('not_handed_over');
    expect(openingRefusal('in_transit')).toBeNull();
    expect(openingRefusal('returned')).toBeNull();
  });

  it('moves forward only: open, submitted, then won or rejected', () => {
    const go = (
      from: 'open' | 'submitted' | 'won',
      to: 'submitted' | 'won' | 'rejected' | 'open',
    ) => transitionRefusal({ from, to, recovered: undefined });
    expect(go('open', 'submitted')).toBeNull();
    expect(go('submitted', 'won')).toBeNull();
    expect(go('submitted', 'rejected')).toBeNull();
    expect(go('open', 'won')).toBe('bad_transition');
    expect(go('won', 'open')).toBe('bad_transition');
  });

  it('takes a recovered amount only with a win', () => {
    expect(transitionRefusal({ from: 'submitted', to: 'won', recovered: 3000 })).toBeNull();
    expect(transitionRefusal({ from: 'submitted', to: 'rejected', recovered: 3000 })).toBe(
      'recovered_without_win',
    );
  });

  it('stamps when the claim was sent and when the carrier answered', () => {
    const at = new Date('2026-11-03T10:00:00Z');
    expect(stampsFor('submitted', at)).toEqual({ submittedAt: at });
    expect(stampsFor('won', at)).toEqual({ closedAt: at });
    expect(stampsFor('open', at)).toEqual({});
  });
});
