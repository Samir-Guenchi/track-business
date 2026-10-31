import { DomainError } from '@trackecom/service-kit';

/** Same error for unknown email, wrong password and locked account: no account enumeration. */
export class InvalidCredentialsError extends DomainError {
  readonly code = 'auth.invalid_credentials';
  readonly kind = 'unauthenticated';

  constructor() {
    super('Email or password is incorrect');
  }
}

export class EmailAlreadyRegisteredError extends DomainError {
  readonly code = 'auth.email_taken';
  readonly kind = 'conflict';

  constructor() {
    super('An account already uses this email');
  }
}

export class WeakPasswordError extends DomainError {
  readonly code = 'auth.weak_password';
  readonly kind = 'invalid';
}

export class InvalidTokenError extends DomainError {
  readonly code = 'auth.invalid_token';
  readonly kind = 'unauthenticated';

  constructor() {
    super('This link or session is invalid or has expired');
  }
}
