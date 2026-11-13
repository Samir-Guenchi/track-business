import type { EventEnvelope } from '@trackecom/contracts';
import type { EventPublisher } from './event-bus.port.js';

export interface OutboxRow {
  readonly id: string;
  readonly payload: EventEnvelope;
}

/**
 * The service's outbox table. `relay` must lock the rows it returns (FOR UPDATE SKIP LOCKED in a
 * transaction, or an equivalent lease) so several replicas can relay without double work.
 */
export interface OutboxStore {
  relay(limit: number, publish: (rows: readonly OutboxRow[]) => Promise<string[]>): Promise<number>;
}

/**
 * Moves committed outbox rows to the bus. At-least-once: a crash between publishing and marking
 * republishes the row, which is why consumers must be idempotent.
 */
export class OutboxRelay {
  constructor(
    private readonly store: OutboxStore,
    private readonly publisher: EventPublisher,
    private readonly batchSize = 100,
  ) {}

  /** Relays one batch; returns how many rows were published. */
  runOnce(): Promise<number> {
    return this.store.relay(this.batchSize, async (rows) => {
      const published: string[] = [];
      for (const row of rows) {
        await this.publisher.publish(row.payload);
        published.push(row.id);
      }
      return published;
    });
  }
}
