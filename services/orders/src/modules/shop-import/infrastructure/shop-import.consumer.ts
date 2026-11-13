import { hostname } from 'node:os';
import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { INTEGRATION_EVENTS } from '@trackecom/contracts';
import { PollingLoop, RedisStreamsConsumer, streamFor } from '@trackecom/events';
import { Redis } from 'ioredis';
import { type Env, ENV } from '../../../config/env.schema.js';
import {
  ImportShopOrderUseCase,
  SHOP_IMPORT_CONSUMER,
} from '../application/import-shop-order.use-case.js';

/** Reads integrations' stream with its own blocking Redis connection, like the shipping consumer. */
@Injectable()
export class ShopImportConsumer implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(ShopImportConsumer.name);
  private redis: Redis | undefined;
  private loop: PollingLoop | undefined;

  constructor(
    private readonly importOrder: ImportShopOrderUseCase,
    @Inject(ENV) private readonly env: Env,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.env.WORKERS_ENABLED) return;
    this.redis = new Redis(this.env.REDIS_URL, { maxRetriesPerRequest: null });
    this.redis.on('error', (error: Error) => this.logger.warn(`Redis: ${error.message}`));
    const consumer = new RedisStreamsConsumer(this.redis, {
      group: SHOP_IMPORT_CONSUMER,
      consumer: `${hostname()}-${process.pid}`,
      streams: [streamFor(INTEGRATION_EVENTS.orderReceived)],
    });
    consumer.subscribe(INTEGRATION_EVENTS.orderReceived, async (event) => {
      await this.importOrder.execute(event);
    });
    this.loop = new PollingLoop(consumer, { idleMs: 200, logger: this.logger });
    this.loop.start();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.loop?.stop();
    this.redis?.disconnect();
  }
}
