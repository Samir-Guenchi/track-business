import { describe, expect, it } from 'vitest';
import { algiersDay, planCall } from './call-plan.js';

const base = {
  status: 'to_confirm',
  unreachedCalls: 0,
  unreachableAfter: 3,
  callBackAt: null,
} as const;

describe('planCall', () => {
  it('confirms and cancels directly', () => {
    expect(planCall({ ...base, outcome: 'confirmed' })?.status).toBe('confirmed');
    expect(planCall({ ...base, status: 'new', outcome: 'cancelled' })?.status).toBe('cancelled');
  });

  it('counts unreached calls and gives up at the store limit', () => {
    expect(planCall({ ...base, outcome: 'busy', unreachedCalls: 1 })).toEqual({
      status: 'to_confirm',
      nextCallAt: null,
      unreachedCalls: 2,
    });
    expect(planCall({ ...base, outcome: 'no_answer', unreachedCalls: 2 })?.status).toBe(
      'unreachable',
    );
  });

  it('brings postponed and call-back orders back at the chosen time', () => {
    const at = new Date('2026-11-02T09:00:00Z');

    expect(planCall({ ...base, status: 'new', outcome: 'postponed', callBackAt: at })).toEqual({
      status: 'postponed',
      nextCallAt: at,
      unreachedCalls: 0,
    });
    expect(
      planCall({ ...base, status: 'postponed', outcome: 'call_back', callBackAt: at })?.nextCallAt,
    ).toEqual(at);
  });

  it('lets a wrong number on a new order end as unreachable', () => {
    expect(planCall({ ...base, status: 'new', outcome: 'wrong_number' })?.status).toBe(
      'unreachable',
    );
  });

  it('refuses outcomes the status machine does not allow', () => {
    expect(planCall({ ...base, status: 'shipped', outcome: 'cancelled' })).toBeNull();
  });
});

describe('algiersDay', () => {
  it('uses the Algiers calendar day (UTC+1)', () => {
    expect(algiersDay(new Date('2026-10-31T23:30:00Z'))).toBe('2026-11-01');
    expect(algiersDay(new Date('2026-10-31T22:59:00Z'))).toBe('2026-10-31');
  });
});
