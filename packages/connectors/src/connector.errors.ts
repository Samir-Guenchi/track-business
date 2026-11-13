/**
 * Why a shop call failed. Only `unavailable` and `rate_limited` are worth retrying; `auth`
 * means the seller must reconnect (the integrations page shows a reconnect button).
 */
export type ConnectorErrorKind =
  'auth' | 'validation' | 'not_found' | 'rate_limited' | 'unavailable' | 'not_supported';

const RETRYABLE: readonly ConnectorErrorKind[] = ['rate_limited', 'unavailable'];

export class ConnectorError extends Error {
  constructor(
    readonly kind: ConnectorErrorKind,
    message: string,
    readonly details: { connector: string; retryAfterMs?: number; status?: number } = {
      connector: '',
    },
  ) {
    super(message);
    this.name = 'ConnectorError';
  }

  get retryable(): boolean {
    return RETRYABLE.includes(this.kind);
  }
}

/** Maps an HTTP status from a shop API onto an error kind. */
export function connectorErrorKind(status: number): ConnectorErrorKind {
  if (status === 401 || status === 403) return 'auth';
  if (status === 404) return 'not_found';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'unavailable';
  return 'validation';
}
