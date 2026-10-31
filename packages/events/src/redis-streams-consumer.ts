import type { EventEnvelope } from '@trackecom/contracts';
import type { Redis } from 'ioredis';
import type { EventHandler, EventSubscriber } from './event-bus.port.js';
import { DEAD_LETTER_STREAM } from './streams.js';

export interface ConsumerOptions {
  /** Consumer group, one per consuming service and purpose, e.g. `orders.shipment-status`. */
  readonly group: string;
  /** This replica's name inside the group (hostname + pid). */
  readonly consumer: string;
  readonly streams: readonly string[];
  readonly batchSize?: number;
  readonly blockMs?: number;
  /** A message idle this long in another consumer's pending list is taken over. */
  readonly claimIdleMs?: number;
  /** Deliveries before a message goes to the dead-letter stream. */
  readonly maxDeliveries?: number;
}

type StreamEntry = [id: string, fields: string[]];
interface StreamMessage {
  readonly stream: string;
  readonly id: string;
  readonly fields: string[];
}

type ReadReply = [stream: string, entries: StreamEntry[]][] | null;

const envelopeOf = (fields: string[]): EventEnvelope | null => {
  const index = fields.indexOf('envelope');
  const raw = index >= 0 ? fields[index + 1] : undefined;
  try {
    return raw ? (JSON.parse(raw) as EventEnvelope) : null;
  } catch {
    return null;
  }
};

/**
 * Consumer-group reader with at-least-once delivery: a message is acknowledged only after every
 * handler for its type succeeded. Failed messages stay pending, are retried after `claimIdleMs`
 * and go to the dead-letter stream after `maxDeliveries`.
 */
export class RedisStreamsConsumer implements EventSubscriber {
  private readonly handlers = new Map<string, EventHandler[]>();
  private running = false;

  constructor(
    private readonly redis: Redis,
    private readonly options: ConsumerOptions,
  ) {}

  subscribe<T>(type: string, handler: EventHandler<T>): void {
    this.handlers.set(type, [...(this.handlers.get(type) ?? []), handler as EventHandler]);
  }

  /** Creates the groups from the start of each stream, so events published before boot are kept. */
  async init(): Promise<void> {
    for (const stream of this.options.streams) {
      await this.redis
        .xgroup('CREATE', stream, this.options.group, '0', 'MKSTREAM')
        .catch((error: Error) => {
          if (!error.message.includes('BUSYGROUP')) throw error;
        });
    }
  }

  /** Reads and handles one batch (new messages, then stale pending ones). Returns messages handled. */
  async pollOnce(): Promise<number> {
    const fresh = (await this.redis.xreadgroup(
      'GROUP',
      this.options.group,
      this.options.consumer,
      'COUNT',
      this.options.batchSize ?? 50,
      'BLOCK',
      this.options.blockMs ?? 1_000,
      'STREAMS',
      ...this.options.streams,
      ...this.options.streams.map(() => '>'),
    )) as ReadReply;
    let handled = 0;
    for (const [stream, entries] of fresh ?? []) handled += await this.handleAll(stream, entries);
    for (const stream of this.options.streams) handled += await this.retryStale(stream);
    return handled;
  }

  async start(): Promise<void> {
    await this.init();
    this.running = true;
    while (this.running) await this.pollOnce();
  }

  stop(): void {
    this.running = false;
  }

  private async handleAll(stream: string, entries: StreamEntry[]): Promise<number> {
    let handled = 0;
    for (const [id, fields] of entries) if (await this.handle({ stream, id, fields })) handled += 1;
    return handled;
  }

  private async handle(message: StreamMessage): Promise<boolean> {
    const event = envelopeOf(message.fields);
    if (!event) return this.deadLetter(message, 'unreadable envelope');
    try {
      for (const handler of this.handlers.get(event.type) ?? []) await handler(event);
      await this.redis.xack(message.stream, this.options.group, message.id);
      return true;
    } catch {
      return false;
    }
  }

  private async retryStale(stream: string): Promise<number> {
    const reply = (await this.redis.xautoclaim(
      stream,
      this.options.group,
      this.options.consumer,
      this.options.claimIdleMs ?? 60_000,
      '0',
      'COUNT',
      50,
    )) as [string, StreamEntry[]];
    let handled = 0;
    for (const [id, fields] of reply[1]) {
      const message = { stream, id, fields };
      if (await this.tooManyDeliveries(stream, id))
        await this.deadLetter(message, 'max deliveries');
      else if (await this.handle(message)) handled += 1;
    }
    return handled;
  }

  private async tooManyDeliveries(stream: string, id: string): Promise<boolean> {
    const pending = (await this.redis.xpending(stream, this.options.group, id, id, 1)) as [
      string,
      string,
      number,
      number,
    ][];
    return (pending[0]?.[3] ?? 0) > (this.options.maxDeliveries ?? 5);
  }

  private async deadLetter(message: StreamMessage, reason: string): Promise<false> {
    const { stream, id, fields } = message;
    const source = ['stream', stream, 'group', this.options.group, 'id', id, 'reason', reason];
    await this.redis.xadd(DEAD_LETTER_STREAM, '*', ...source, ...fields);
    await this.redis.xack(stream, this.options.group, id);
    return false;
  }
}
