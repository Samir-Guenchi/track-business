import { DomainError } from '@trackecom/service-kit';

/** The order names a wilaya or commune we do not know (old data or a typo upstream). */
export class UnknownPlaceError extends DomainError {
  readonly code = 'shipments.unknown_place';
  readonly kind = 'invalid';
}
