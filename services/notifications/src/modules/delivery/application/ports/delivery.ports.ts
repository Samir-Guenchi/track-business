import type {
  Channel,
  MessageLanguage,
  NotificationTrigger,
  OrderContact,
  SkipReason,
} from '@trackecom/contracts';

export interface NewMessage {
  readonly id: string;
  readonly storeId: string;
  readonly orderId: string;
  readonly trigger: NotificationTrigger;
  readonly channel: Channel;
  readonly language: MessageLanguage;
  readonly sourceEventId: string;
  readonly shipmentId: string | null;
  readonly sendAfter: Date;
  readonly queuedAt: Date;
}

/** A due message, leased to this replica; `attempts` already counts this try. */
export interface DueMessage extends NewMessage {
  readonly attempts: number;
}

export type SendOutcome =
  | { kind: 'sent'; provider: string; providerId: string; costCentimes: number; at: Date }
  | { kind: 'skipped'; reason: SkipReason }
  | { kind: 'retry'; sendAfter: Date; error: string }
  | { kind: 'failed'; error: string };

export interface Receipt {
  readonly providerId: string;
  readonly status: 'delivered' | 'failed';
  readonly at: Date;
}

export interface MessageQueue {
  /** false when this event already queued this trigger (redelivery). */
  enqueue(message: NewMessage): Promise<boolean>;
  claimDue(lease: { now: Date; until: Date; limit: number }): Promise<DueMessage[]>;
  complete(id: string, outcome: SendOutcome): Promise<void>;
  /** false when no sent message has this provider id. */
  applyReceipt(provider: string, receipt: Receipt): Promise<boolean>;
}

export interface ParcelRef {
  readonly shipmentId: string;
  readonly storeId: string;
  readonly orderId: string;
  readonly carrier: string;
  readonly publicCode: string;
}

export interface ParcelDirectory {
  save(parcel: ParcelRef): Promise<void>;
  find(shipmentId: string): Promise<ParcelRef | null>;
}

/** Reads the customer's name and phone from orders at send time (ADR-0004). */
export interface ContactDirectory {
  /** null when orders has no such order; throws when orders cannot be reached. */
  contactFor(storeId: string, orderId: string): Promise<OrderContact | null>;
}

/** An SMS gateway or WhatsApp API. Adapters live in infrastructure, one per provider. */
export interface MessageProvider {
  readonly name: string;
  send(message: { channel: Channel; to: string; body: string }): Promise<{
    providerId: string;
    costCentimes: number;
  }>;
  /** The provider's delivery receipt webhook body, or null when it is not one. */
  parseReceipt(body: unknown): Receipt | null;
}

/** A send that failed; `retryable` for timeouts and 5xx, not for a refused number. */
export class ProviderError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
  }
}

export const DELIVERY_PORTS = {
  queue: Symbol('MessageQueue'),
  parcels: Symbol('ParcelDirectory'),
  contacts: Symbol('ContactDirectory'),
  provider: Symbol('MessageProvider'),
  sender: Symbol('SenderDeps'),
} as const;
