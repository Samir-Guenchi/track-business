import type { EventEnvelope } from '@trackecom/contracts';

export type EventHandler<T = unknown> = (event: EventEnvelope<T>) => Promise<void>;

/** Publishing side. Services publish through the outbox relay, never directly from a use case. */
export interface EventPublisher {
  publish(event: EventEnvelope): Promise<void>;
}

/** Consuming side. Handlers must be idempotent: the bus delivers at least once. */
export interface EventSubscriber {
  subscribe<T>(type: string, handler: EventHandler<T>): void;
}

export interface EventBus extends EventPublisher, EventSubscriber {}
