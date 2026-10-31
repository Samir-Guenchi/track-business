import { describe, expect, it } from 'vitest';
import { WeakPasswordError } from './auth.errors.js';
import { AFTER_SUCCESSFUL_LOGIN, LOCKOUT_MS, afterFailedLogin, isLocked } from './login-lockout.js';
import { assertStrongPassword } from './password-policy.js';

const person = { email: 'amina.store@example.dz', name: 'Amina Benali' };

describe('assertStrongPassword', () => {
  it('accepts a long unrelated passphrase', () => {
    expect(() => assertStrongPassword('colis rapide vers Oran', person)).not.toThrow();
  });

  it.each(['azertyuiop', 'aaaaaaaaaaaa', 'amina.store2026', 'AminaBenali!!'])(
    'rejects %s',
    (password) => {
      expect(() => assertStrongPassword(password, person)).toThrow(WeakPasswordError);
    },
  );
});

describe('login lockout', () => {
  const now = new Date('2026-10-31T12:00:00Z');

  it('locks for 15 minutes on the fifth failure', () => {
    let state = AFTER_SUCCESSFUL_LOGIN;
    for (let i = 0; i < 5; i += 1) state = afterFailedLogin(state, now);

    expect(state.lockedUntil?.getTime()).toBe(now.getTime() + LOCKOUT_MS);
    expect(isLocked(state, now)).toBe(true);
  });

  it('stays unlocked after four failures', () => {
    let state = AFTER_SUCCESSFUL_LOGIN;
    for (let i = 0; i < 4; i += 1) state = afterFailedLogin(state, now);

    expect(isLocked(state, now)).toBe(false);
  });

  it('unlocks once the lock has expired', () => {
    const state = { failedLoginCount: 0, lockedUntil: new Date(now.getTime() - 1) };

    expect(isLocked(state, now)).toBe(false);
  });
});
