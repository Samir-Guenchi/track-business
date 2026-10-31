import type { EventEnvelope } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import { InMemoryEventBus } from './in-memory-event-bus.js';

const anEvent = (type: string): EventEnvelope => ({
  id: 'evt_1',
  type,
  occurredAt: '2026-10-31T12:00:00Z',
  storeId: 'store_1',
  correlationId: 'corr_1',
  data: {},
});

describe('InMemoryEventBus', () => {
  it('delivers an event to every handler of its type', async () => {
    const bus = new InMemoryEventBus();
    const received: string[] = [];
    bus.subscribe('orders.order.confirmed.v1', async (e) => void received.push(`a:${e.id}`));
    bus.subscribe('orders.order.confirmed.v1', async (e) => void received.push(`b:${e.id}`));

    await bus.publish(anEvent('orders.order.confirmed.v1'));

    expect(received).toEqual(['a:evt_1', 'b:evt_1']);
  });

  it('ignores events nobody subscribed to', async () => {
    const bus = new InMemoryEventBus();

    await expect(bus.publish(anEvent('orders.order.cancelled.v1'))).resolves.toBeUndefined();
  });
});
