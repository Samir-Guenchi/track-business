import type { EventEnvelope } from '@trackecom/contracts';
import { Redis } from 'ioredis';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { OutboxRelay, type OutboxRow, type OutboxStore } from './outbox-relay.js';
import { RedisStreamsConsumer } from './redis-streams-consumer.js';
import { RedisStreamsPublisher } from './redis-streams-publisher.js';
import { DEAD_LETTER_STREAM } from './streams.js';

const REDIS_URL = process.env.TEST_REDIS_URL;
const TYPE = 'shipping.shipment.status-changed.v1';

const anEvent = (id: string): EventEnvelope => ({
  id,
  type: TYPE,
  occurredAt: '2026-10-31T12:00:00Z',
  storeId: 'store_1',
  correlationId: 'corr_1',
  data: { n: id },
});

class FakeOutbox implements OutboxStore {
  readonly published = new Set<string>();
  constructor(private readonly rows: OutboxRow[]) {}

  async relay(
    limit: number,
    publish: (rows: readonly OutboxRow[]) => Promise<string[]>,
  ): Promise<number> {
    const batch = this.rows.filter((row) => !this.published.has(row.id)).slice(0, limit);
    const ids = await publish(batch);
    ids.forEach((id) => this.published.add(id));
    return ids.length;
  }
}

describe.skipIf(!REDIS_URL)('Redis Streams bus', () => {
  const redis = new Redis(REDIS_URL ?? '', { db: 3, lazyConnect: true });
  const publisher = new RedisStreamsPublisher(redis);
  const consumerFor = (maxDeliveries = 5) =>
    new RedisStreamsConsumer(redis, {
      group: 'test.group',
      consumer: 'test-1',
      streams: ['events:shipping'],
      blockMs: 10,
      claimIdleMs: 0,
      maxDeliveries,
    });

  beforeEach(async () => {
    await redis.flushdb();
  });

  afterAll(async () => {
    await redis.flushdb();
    redis.disconnect();
  });

  it('delivers a published event once and acknowledges it', async () => {
    const consumer = consumerFor();
    const seen: string[] = [];
    consumer.subscribe(TYPE, async (event) => void seen.push(event.id));
    await consumer.init();

    await publisher.publish(anEvent('evt_1'));

    expect(await consumer.pollOnce()).toBe(1);
    expect(await consumer.pollOnce()).toBe(0);
    expect(seen).toEqual(['evt_1']);
  });

  it('keeps events published before the consumer group existed', async () => {
    await publisher.publish(anEvent('evt_early'));
    const consumer = consumerFor();
    const seen: string[] = [];
    consumer.subscribe(TYPE, async (event) => void seen.push(event.id));
    await consumer.init();

    await consumer.pollOnce();

    expect(seen).toEqual(['evt_early']);
  });

  it('retries a failed handler, then dead-letters it after too many deliveries', async () => {
    const consumer = consumerFor(2);
    let calls = 0;
    consumer.subscribe(TYPE, async () => {
      calls += 1;
      throw new Error('downstream unavailable');
    });
    await consumer.init();
    await publisher.publish(anEvent('evt_bad'));

    for (let round = 0; round < 4; round += 1) await consumer.pollOnce();

    expect(calls).toBeGreaterThanOrEqual(2);
    const dead = await redis.xrange(DEAD_LETTER_STREAM, '-', '+');
    expect(dead).toHaveLength(1);
    expect(dead[0]?.[1]).toContain('max deliveries');
  });

  it('recovers when a handler succeeds on retry', async () => {
    const consumer = consumerFor();
    let calls = 0;
    consumer.subscribe(TYPE, async () => {
      calls += 1;
      if (calls === 1) throw new Error('flaky');
    });
    await consumer.init();
    await publisher.publish(anEvent('evt_flaky'));

    await consumer.pollOnce();
    await consumer.pollOnce();

    expect(calls).toBe(2);
    expect(await redis.xlen(DEAD_LETTER_STREAM)).toBe(0);
  });

  it('relays outbox rows in batches', async () => {
    const outbox = new FakeOutbox(['a', 'b', 'c'].map((id) => ({ id, payload: anEvent(id) })));
    const relay = new OutboxRelay(outbox, publisher, 2);

    expect(await relay.runOnce()).toBe(2);
    expect(await relay.runOnce()).toBe(1);
    expect(await relay.runOnce()).toBe(0);
    expect(await redis.xlen('events:shipping')).toBe(3);
  });
});
