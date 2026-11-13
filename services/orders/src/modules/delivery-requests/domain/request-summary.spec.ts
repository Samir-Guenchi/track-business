import { describe, expect, it } from 'vitest';
import { requestSummary } from './request-summary.js';

describe('delivery request summary', () => {
  it('keeps the detail the seller acts on', () => {
    expect(requestSummary({ kind: 'reschedule', date: '2026-11-08' })).toBe(
      'reschedule: 2026-11-08',
    );
    expect(requestSummary({ kind: 'call_after', time: '18:00' })).toBe('call_after: 18:00');
    expect(requestSummary({ kind: 'switch_stopdesk' })).toBe('switch_stopdesk');
  });

  it('adds the landmark to a corrected address when there is one', () => {
    expect(requestSummary({ kind: 'fix_address', address: 'Cité 200 logements' })).toBe(
      'fix_address: Cité 200 logements',
    );
    expect(
      requestSummary({ kind: 'fix_address', address: 'Cité 200 logements', landmark: 'mosquée' }),
    ).toBe('fix_address: Cité 200 logements (mosquée)');
  });
});
