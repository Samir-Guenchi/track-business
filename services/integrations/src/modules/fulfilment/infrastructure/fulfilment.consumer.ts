import { hostname } from 'node:os';
import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { SHIPMENT_EVENTS } from '@trackecom/contracts';
import { PollingLoop, RedisStreamsConsumer, streamFor } from '@trackecom/events';
import { Redis } from 'ioredis';
import { type Env, ENV } from '../../../config/env.schema.js';
import {
  PushFulfilmentUseCase,
  FULFILMENT_CONSUMER,
} from '../application/push-fulfilment.use-case.js';

/** Reads shipping's parcel-created events with its own blocking Redis connection. */
@Injectable()
export class FulfilmentConsumer implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(FulfilmentConsumer.name);
  private redis: Redis | undefined;
  private loop: PollingLoop | undefined;

  constructor(
    private readonly pushFulfilment: PushFulfilmentUseCase,
    @Inject(ENV) private readonly env: Env,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.env.WORKERS_ENABLED) return;
    this.redis = new Redis(this.env.REDIS_URL, { maxRetriesPerRequest: null });
    this.redis.on('error', (error: Error) => this.logger.warn(`Redis: ${error.message}`));
    const consumer = new RedisStreamsConsumer(this.redis, {
      group: FULFILMENT_CONSUMER,
      consumer: `${hostname()}-${process.pid}`,
      streams: [streamFor(SHIPMENT_EVENTS.created)],
    });
    consumer.subscribe(SHIPMENT_EVENTS.created, async (event) => {
      await this.pushFulfilment.execute(event);
    });
    this.loop = new PollingLoop(consumer, { idleMs: 200, logger: this.logger });
    this.loop.start();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.loop?.stop();
    this.redis?.disconnect();
  }
}
