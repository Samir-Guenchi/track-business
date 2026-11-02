import { hostname } from 'node:os';
import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { ORDER_EVENTS, SHIPMENT_EVENTS, TRACKING_EVENTS } from '@trackecom/contracts';
import { PollingLoop, RedisStreamsConsumer, streamFor } from '@trackecom/events';
import { Redis } from 'ioredis';
import { type Env, ENV } from '../../../config/env.schema.js';
import { DELIVERY_CONSUMER, EnqueueMessages } from '../application/enqueue-messages.js';

/** Reads the orders and shipping streams with its own Redis connection, on every replica. */
@Injectable()
export class DeliveryEventsConsumer implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(DeliveryEventsConsumer.name);
  private redis: Redis | undefined;
  private loop: PollingLoop | undefined;

  constructor(
    private readonly enqueue: EnqueueMessages,
    @Inject(ENV) private readonly env: Env,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.env.WORKERS_ENABLED) return;
    this.redis = new Redis(this.env.REDIS_URL, { maxRetriesPerRequest: null });
    this.redis.on('error', (error: Error) => this.logger.warn(`Redis: ${error.message}`));
    const consumer = new RedisStreamsConsumer(this.redis, {
      group: DELIVERY_CONSUMER,
      consumer: `${hostname()}-${process.pid}`,
      streams: [streamFor(ORDER_EVENTS.statusChanged), streamFor(SHIPMENT_EVENTS.created)],
    });
    consumer.subscribe(ORDER_EVENTS.statusChanged, (event) =>
      this.enqueue.orderStatusChanged(event),
    );
    consumer.subscribe(SHIPMENT_EVENTS.created, (event) => this.enqueue.shipmentCreated(event));
    consumer.subscribe(TRACKING_EVENTS.statusChanged, (event) =>
      this.enqueue.parcelStatusChanged(event),
    );
    this.loop = new PollingLoop(consumer, { idleMs: 200, logger: this.logger });
    this.loop.start();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.loop?.stop();
    this.redis?.disconnect();
  }
}
