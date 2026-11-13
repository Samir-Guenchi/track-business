import { hostname } from 'node:os';
import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { SHIPMENT_EVENTS, TRACKING_EVENTS } from '@trackecom/contracts';
import { PollingLoop, RedisStreamsConsumer, streamFor } from '@trackecom/events';
import { Redis } from 'ioredis';
import { type Env, ENV } from '../../../config/env.schema.js';
import {
  PARCEL_EVENTS_CONSUMER,
  ParcelEventsUseCase,
} from '../application/parcel-events.use-case.js';

/** Reads shipping's stream (parcel created, delivered, returned) with its own Redis connection. */
@Injectable()
export class ParcelEventsConsumer implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(ParcelEventsConsumer.name);
  private redis: Redis | undefined;
  private loop: PollingLoop | undefined;

  constructor(
    private readonly parcels: ParcelEventsUseCase,
    @Inject(ENV) private readonly env: Env,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.env.WORKERS_ENABLED) return;
    this.redis = new Redis(this.env.REDIS_URL, { maxRetriesPerRequest: null });
    this.redis.on('error', (error: Error) => this.logger.warn(`Redis: ${error.message}`));
    const consumer = new RedisStreamsConsumer(this.redis, {
      group: PARCEL_EVENTS_CONSUMER,
      consumer: `${hostname()}-${process.pid}`,
      streams: [streamFor(SHIPMENT_EVENTS.created)],
    });
    consumer.subscribe(SHIPMENT_EVENTS.created, async (event) => {
      await this.parcels.shipmentCreated(event);
    });
    consumer.subscribe(TRACKING_EVENTS.statusChanged, async (event) => {
      await this.parcels.statusChanged(event);
    });
    this.loop = new PollingLoop(consumer, { idleMs: 200, logger: this.logger });
    this.loop.start();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.loop?.stop();
    this.redis?.disconnect();
  }
}
