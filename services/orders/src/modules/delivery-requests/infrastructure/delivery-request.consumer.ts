import { hostname } from 'node:os';
import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { DELIVERY_REQUEST_EVENTS } from '@trackecom/contracts';
import { PollingLoop, RedisStreamsConsumer, streamFor } from '@trackecom/events';
import { Redis } from 'ioredis';
import { type Env, ENV } from '../../../config/env.schema.js';
import { DELIVERY_REQUESTS_CONSUMER } from '../application/order-history.port.js';
import { RecordDeliveryRequestUseCase } from '../application/record-delivery-request.use-case.js';

/** Its own consumer group on shipping's delivery-request stream (#136). */
@Injectable()
export class DeliveryRequestConsumer implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(DeliveryRequestConsumer.name);
  private redis: Redis | undefined;
  private loop: PollingLoop | undefined;

  constructor(
    private readonly record: RecordDeliveryRequestUseCase,
    @Inject(ENV) private readonly env: Env,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.env.WORKERS_ENABLED) return;
    this.redis = new Redis(this.env.REDIS_URL, { maxRetriesPerRequest: null });
    this.redis.on('error', (error: Error) => this.logger.warn(`Redis: ${error.message}`));
    const consumer = new RedisStreamsConsumer(this.redis, {
      group: DELIVERY_REQUESTS_CONSUMER,
      consumer: `${hostname()}-${process.pid}`,
      streams: [streamFor(DELIVERY_REQUEST_EVENTS.created)],
    });
    consumer.subscribe(DELIVERY_REQUEST_EVENTS.created, async (event) => {
      await this.record.execute(event);
    });
    this.loop = new PollingLoop(consumer, { idleMs: 200, logger: this.logger });
    this.loop.start();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.loop?.stop();
    this.redis?.disconnect();
  }
}
