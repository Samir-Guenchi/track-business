import { DomainError } from '@trackecom/service-kit';

export class PickupPointNotFoundError extends DomainError {
  readonly code = 'pickup_points.not_found';
  readonly kind = 'not_found';
}

export class PickupParcelNotFoundError extends DomainError {
  readonly code = 'pickup_points.parcel_not_found';
  readonly kind = 'not_found';
}

/** The shop is full, inactive, or the parcel cannot go there (delivered, already at a point). */
export class PickupDropRefusedError extends DomainError {
  readonly code = 'pickup_points.drop_refused';
  readonly kind = 'conflict';
}

export class PickupAlreadyReleasedError extends DomainError {
  readonly code = 'pickup_points.already_released';
  readonly kind = 'conflict';
}

export class WrongPickupCodeError extends DomainError {
  readonly code = 'pickup_points.wrong_code';
  readonly kind = 'forbidden';
}

export class PickupLockedError extends DomainError {
  readonly code = 'pickup_points.locked';
  readonly kind = 'rate_limited';
}
