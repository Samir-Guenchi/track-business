import type { EventEnvelope } from '@trackecom/contracts';
import type { EventBus, EventHandler } from './event-bus.port.js';

/** For unit tests and local experiments. Production uses the Redis Streams adapter (#12). */
export class InMemoryEventBus implements EventBus {
  private readonly handlers = new Map<string, EventHandler[]>();

  subscribe<T>(type: string, handler: EventHandler<T>): void {
    const current = this.handlers.get(type) ?? [];
    this.handlers.set(type, [...current, handler as EventHandler]);
  }

  async publish(event: EventEnvelope): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? [];
    await Promise.all(handlers.map((handle) => handle(event)));
  }
}
