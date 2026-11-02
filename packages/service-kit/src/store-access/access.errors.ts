import { DomainError } from '../errors/domain-error.js';

/** Same codes as identity, so clients handle auth failures identically for every service. */
export class InvalidTokenError extends DomainError {
  readonly code = 'auth.invalid_token';
  readonly kind = 'unauthenticated';

  constructor() {
    super('Missing, invalid or expired access token');
  }
}

export class AccessDeniedError extends DomainError {
  readonly code = 'auth.forbidden';
  readonly kind = 'forbidden';

  constructor() {
    super('You do not have access to this action in this store');
  }
}
