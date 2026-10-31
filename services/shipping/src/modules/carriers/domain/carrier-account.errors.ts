import { DomainError } from '@trackecom/service-kit';

export class CarrierNotSupportedError extends DomainError {
  readonly code = 'carriers.not_supported';
  readonly kind = 'not_found';
}

export class InvalidCredentialsError extends DomainError {
  readonly code = 'carriers.invalid_credentials';
  readonly kind = 'invalid';
}

export class CarrierNotConnectedError extends DomainError {
  readonly code = 'carriers.not_connected';
  readonly kind = 'conflict';
}
