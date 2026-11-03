import { DomainError } from '@trackecom/service-kit';

export class LiveSessionNotFoundError extends DomainError {
  readonly code = 'live_selling.session_not_found';
  readonly kind = 'not_found';
}

export class LiveReservationNotFoundError extends DomainError {
  readonly code = 'live_selling.reservation_not_found';
  readonly kind = 'not_found';
}
