import { describe, expect, it } from 'vitest';
import { checkableAttempt } from './attempt-check.js';

const now = new Date('2026-11-03T12:00:00Z');
const event = (status: string | null, failureReason: string | null, at = now) => ({
  id: 'e1',
  status,
  failureReason,
  at,
});

describe('checkableAttempt', () => {
  it.each(['absent', 'no_answer', 'phone_off', 'refused'])('asks about "%s"', (reason) => {
    expect(checkableAttempt(event('failed_attempt', reason), now)).toEqual({
      eventId: 'e1',
      at: now,
      reason,
    });
  });

  it('does not ask about a wrong address or an unknown reason', () => {
    expect(checkableAttempt(event('failed_attempt', 'wrong_address'), now)).toBeNull();
    expect(checkableAttempt(event('failed_attempt', null), now)).toBeNull();
  });

  it('stops asking once the parcel moved on or after a week', () => {
    expect(checkableAttempt(event('out_for_delivery', 'absent'), now)).toBeNull();
    const old = new Date(now.getTime() - 8 * 86_400_000);
    expect(checkableAttempt(event('failed_attempt', 'absent', old), now)).toBeNull();
    expect(checkableAttempt(null, now)).toBeNull();
  });
});
