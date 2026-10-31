import type { EventEnvelope } from '@trackecom/contracts';
import type { Redis } from 'ioredis';
import type { EventPublisher } from './event-bus.port.js';
import { STREAM_MAX_LENGTH, streamFor } from './streams.js';

/** Appends envelopes to the producing service's stream. Called by the outbox relay only. */
export class RedisStreamsPublisher implements EventPublisher {
  constructor(private readonly redis: Redis) {}

  async publish(event: EventEnvelope): Promise<void> {
    await this.redis.xadd(
      streamFor(event.type),
      'MAXLEN',
      '~',
      STREAM_MAX_LENGTH,
      '*',
      'type',
      event.type,
      'envelope',
      JSON.stringify(event),
    );
  }
}
