import { DomainError } from '@trackecom/service-kit';

export class ConnectorNotSupportedError extends DomainError {
  readonly code = 'integrations.not_supported';
  readonly kind = 'not_found';
}

export class InvalidShopCredentialsError extends DomainError {
  readonly code = 'integrations.invalid_credentials';
  readonly kind = 'invalid';
}

export class ConnectionNotFoundError extends DomainError {
  readonly code = 'integrations.not_found';
  readonly kind = 'not_found';

  constructor() {
    super('This shop is not connected to the store');
  }
}
