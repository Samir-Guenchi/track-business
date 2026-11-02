import { DomainError } from '@trackecom/service-kit';

export class TrackingNotFoundError extends DomainError {
  readonly code = 'tracking.not_found';
  readonly kind = 'not_found';
}

/** Another update of the same shipment committed first; the ingest is retried. */
export class TrackingConflictError extends DomainError {
  readonly code = 'tracking.conflict';
  readonly kind = 'conflict';
}

export class WebhooksNotSupportedError extends DomainError {
  readonly code = 'tracking.webhooks_not_supported';
  readonly kind = 'not_found';
}

/** Bad or missing signature: the request did not come from the carrier. */
export class WebhookRejectedError extends DomainError {
  readonly code = 'tracking.webhook_rejected';
  readonly kind = 'unauthenticated';
}
