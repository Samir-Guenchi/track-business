import { randomUUID } from 'node:crypto';

/** A row of the transactional outbox; `payload` is the full event envelope. */
export interface OutboxMessage {
  readonly id: string;
  readonly type: string;
  readonly storeId: string;
  readonly correlationId: string;
  readonly payload: unknown;
  readonly occurredAt: Date;
}

export interface EventOrigin {
  readonly storeId: string;
  readonly correlationId: string;
  readonly now: Date;
}

/** Wraps event data in the envelope every consumer reads (packages/contracts events). */
export function outboxMessage(origin: EventOrigin, type: string, data: unknown): OutboxMessage {
  const id = randomUUID();
  const { storeId, correlationId, now } = origin;
  const payload = { id, type, occurredAt: now.toISOString(), storeId, correlationId, data };
  return { id, type, storeId, correlationId, payload, occurredAt: now };
}
