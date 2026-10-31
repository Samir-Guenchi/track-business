export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;

export interface LockoutState {
  readonly failedLoginCount: number;
  readonly lockedUntil: Date | null;
}

export function isLocked(state: LockoutState, now: Date): boolean {
  return state.lockedUntil !== null && state.lockedUntil > now;
}

/** After 5 wrong passwords in a row the account refuses logins for 15 minutes. */
export function afterFailedLogin(state: LockoutState, now: Date): LockoutState {
  const failedLoginCount = state.failedLoginCount + 1;
  if (failedLoginCount < MAX_FAILED_LOGINS)
    return { failedLoginCount, lockedUntil: state.lockedUntil };
  return { failedLoginCount: 0, lockedUntil: new Date(now.getTime() + LOCKOUT_MS) };
}

export const AFTER_SUCCESSFUL_LOGIN: LockoutState = { failedLoginCount: 0, lockedUntil: null };
