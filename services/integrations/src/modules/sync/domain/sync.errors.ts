import type { ImportProblem } from '@trackecom/contracts';
import { DomainError } from '@trackecom/service-kit';

export class UnknownShopError extends DomainError {
  readonly code = 'integrations.unknown_shop';
  readonly kind = 'not_found';

  constructor() {
    super('No shop is connected at this address');
  }
}

export class BadWebhookSignatureError extends DomainError {
  readonly code = 'integrations.bad_signature';
  readonly kind = 'unauthenticated';

  constructor() {
    super('The webhook signature does not match');
  }
}

export class PendingOrderNotFoundError extends DomainError {
  readonly code = 'integrations.pending_not_found';
  readonly kind = 'not_found';

  constructor() {
    super('This shop order is not waiting for a fix');
  }
}

export class StillNeedsFixError extends DomainError {
  readonly code = 'integrations.still_needs_fix';
  readonly kind = 'invalid';

  constructor(problem: ImportProblem) {
    super(`The order still has a problem: ${problem}`, { problem });
  }
}
