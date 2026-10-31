import type { OrderStatus } from '@trackecom/contracts';
import { DomainError } from '@trackecom/service-kit';

export class OrderNotFoundError extends DomainError {
  readonly code = 'orders.not_found';
  readonly kind = 'not_found';

  constructor() {
    super('Order not found');
  }
}

export class IllegalTransitionError extends DomainError {
  readonly code = 'orders.illegal_transition';
  readonly kind = 'conflict';

  constructor(from: OrderStatus, to: OrderStatus) {
    super(`An order cannot go from ${from} to ${to}`, { from, to });
  }
}

export class OrderLockedError extends DomainError {
  readonly code = 'orders.locked';
  readonly kind = 'conflict';

  constructor(status: OrderStatus) {
    super(`An order in status ${status} can no longer be edited or deleted`, { status });
  }
}

/** Someone else changed the order between our read and our write; the client should reload. */
export class OrderConflictError extends DomainError {
  readonly code = 'orders.conflict';
  readonly kind = 'conflict';

  constructor() {
    super('The order was changed by someone else; reload it and try again');
  }
}

export class AlreadyImportedError extends DomainError {
  readonly code = 'orders.already_imported';
  readonly kind = 'conflict';

  constructor(existingOrderId: string) {
    super('This order was already imported from the same source', { existingOrderId });
  }
}

export class InvalidAmountError extends DomainError {
  readonly code = 'orders.invalid_amount';
  readonly kind = 'invalid';

  constructor() {
    super('The discount cannot exceed the items plus the shipping fee');
  }
}

export class StatusPermissionError extends DomainError {
  readonly code = 'auth.forbidden';
  readonly kind = 'forbidden';

  constructor(status: OrderStatus) {
    super(`Your role cannot move orders to ${status}`, { status });
  }
}
