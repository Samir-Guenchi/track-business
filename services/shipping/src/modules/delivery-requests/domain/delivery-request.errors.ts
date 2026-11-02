import { DomainError } from '@trackecom/service-kit';
import type { Refusal } from './delivery-choices.js';

/** The parcel is out for delivery or closed: the courier can no longer be told. */
export class DeliveryChoicesClosedError extends DomainError {
  readonly code = 'delivery_requests.closed';
  readonly kind = 'conflict';
}

/** This parcel does not offer that choice (a stop-desk parcel, no stop-desk in the wilaya). */
export class ChoiceNotOfferedError extends DomainError {
  readonly code = 'delivery_requests.not_offered';
  readonly kind = 'invalid';
}

export class DeliveryDateOutOfRangeError extends DomainError {
  readonly code = 'delivery_requests.bad_date';
  readonly kind = 'invalid';
}

export class TooManyDeliveryRequestsError extends DomainError {
  readonly code = 'delivery_requests.too_many';
  readonly kind = 'rate_limited';
}

export class DeliveryRequestNotFoundError extends DomainError {
  readonly code = 'delivery_requests.not_found';
  readonly kind = 'not_found';
}

export function errorFor(refusal: Refusal): DomainError {
  switch (refusal) {
    case 'closed':
      return new DeliveryChoicesClosedError('This parcel can no longer be changed');
    case 'not_offered':
      return new ChoiceNotOfferedError('This choice is not offered for this parcel');
    case 'bad_date':
      return new DeliveryDateOutOfRangeError('Pick a day between tomorrow and next week');
    case 'too_many':
      return new TooManyDeliveryRequestsError('Too many changes today for this parcel');
  }
}
