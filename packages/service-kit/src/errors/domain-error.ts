/** What kind of failure a domain error is; the HTTP filter maps each kind to one status code. */
export type DomainErrorKind =
  'invalid' | 'unauthenticated' | 'forbidden' | 'not_found' | 'conflict' | 'rate_limited';

/**
 * Base class for expected business failures. `code` is a stable string clients can switch on,
 * e.g. `orders.already_shipped`. Domain code never imports HTTP; it only picks a kind.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly kind: DomainErrorKind;
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    if (details !== undefined) this.details = details;
  }
}
