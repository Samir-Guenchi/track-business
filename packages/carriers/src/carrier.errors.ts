/**
 * Why a carrier call failed. Only `unavailable` and `rate_limited` are worth retrying;
 * everything else needs a person (wrong credentials, bad address...).
 */
export type CarrierErrorKind =
  'auth' | 'validation' | 'not_found' | 'rate_limited' | 'unavailable' | 'not_supported';

const RETRYABLE: readonly CarrierErrorKind[] = ['rate_limited', 'unavailable'];

export class CarrierError extends Error {
  constructor(
    readonly kind: CarrierErrorKind,
    message: string,
    readonly details: { carrier: string; retryAfterMs?: number; status?: number } = { carrier: '' },
  ) {
    super(message);
    this.name = 'CarrierError';
  }

  get retryable(): boolean {
    return RETRYABLE.includes(this.kind);
  }
}

/** Maps an HTTP status from a carrier API onto an error kind. */
export function kindForStatus(status: number): CarrierErrorKind {
  if (status === 401 || status === 403) return 'auth';
  if (status === 404) return 'not_found';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'unavailable';
  return 'validation';
}
