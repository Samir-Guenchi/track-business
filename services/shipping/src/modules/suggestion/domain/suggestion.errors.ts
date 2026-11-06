import { DomainError } from '@trackecom/service-kit';

/** No origin in the request and none in the store profile: no route to price. */
export class OriginUnknownError extends DomainError {
  readonly code = 'suggestion.origin_unknown';
  readonly kind = 'invalid';
}
