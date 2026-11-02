import { type OrderStatus, type SelfConfirmRequest, canTransition } from '@trackecom/contracts';
import { DomainError } from '@trackecom/service-kit';

export interface LinkRecord {
  readonly id: string;
  readonly storeId: string;
  readonly orderId: string;
  readonly expiresAt: Date;
  readonly usedAt: Date | null;
}

/** Statuses a customer may still answer from: anything before the order is confirmed. */
const OPEN_STATUSES: readonly OrderStatus[] = ['new', 'to_confirm', 'unreachable', 'postponed'];

export const canAnswer = (link: LinkRecord, status: OrderStatus, now: Date): boolean =>
  link.usedAt === null && link.expiresAt > now && OPEN_STATUSES.includes(status);

/** The status the customer's answer leads to; `new` goes through confirmation first. */
export function answerStatus(request: SelfConfirmRequest, from: OrderStatus): OrderStatus | null {
  const to: OrderStatus = request.action === 'cancel' ? 'cancelled' : 'confirmed';
  const via = from === 'new' && !canTransition('new', to) ? 'to_confirm' : from;
  return canTransition(via, to) ? to : null;
}

/** Unknown or expired token. Same answer for both, so tokens cannot be probed. */
export class LinkNotFoundError extends DomainError {
  readonly code = 'self_confirm.link_not_found';
  readonly kind = 'not_found';

  constructor() {
    super('This link does not exist or has expired');
  }
}

/** The link was already used, or the order is past confirmation. */
export class LinkClosedError extends DomainError {
  readonly code = 'self_confirm.link_closed';
  readonly kind = 'conflict';

  constructor() {
    super('This order can no longer be answered from this link');
  }
}
