import { apiBaseUrl } from './api-base-url';

let inFlight: Promise<boolean> | null = null;

/**
 * Rotates the session with the httpOnly refresh cookie. Parallel 401s share one call,
 * because identity revokes a refresh token once it is used.
 */
export function refreshSession(): Promise<boolean> {
  inFlight ??= fetch(new URL('/auth/refresh', apiBaseUrl), {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/** Auth routes answer 401 on purpose (wrong password, expired link); only `/auth/me` may refresh. */
export function canRefreshAfter(path: string): boolean {
  return !path.startsWith('/auth/') || path === '/auth/me';
}
