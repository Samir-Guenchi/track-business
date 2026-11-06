import { hostname } from 'node:os';
import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { STORE_EVENTS } from '@trackecom/contracts';
import { PollingLoop, RedisStreamsConsumer, streamFor } from '@trackecom/events';
import { Redis } from 'ioredis';
import { type Env, ENV } from '../../../config/env.schema.js';
import { ApplyStoreProfileUseCase } from '../application/apply-store-profile.use-case.js';
import { STORE_PROFILE_CONSUMER } from '../application/store-origin.port.js';

/** Its own consumer group on identity's store profile stream (#160). */
@Injectable()
export class StoreProfileConsumer implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(StoreProfileConsumer.name);
  private redis: Redis | undefined;
  private loop: PollingLoop | undefined;

  constructor(
    private readonly apply: ApplyStoreProfileUseCase,
    @Inject(ENV) private readonly env: Env,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.env.WORKERS_ENABLED) return;
    this.redis = new Redis(this.env.REDIS_URL, { maxRetriesPerRequest: null });
    this.redis.on('error', (error: Error) => this.logger.warn(`Redis: ${error.message}`));
    const consumer = new RedisStreamsConsumer(this.redis, {
      group: STORE_PROFILE_CONSUMER,
      consumer: `${hostname()}-${process.pid}`,
      streams: [streamFor(STORE_EVENTS.profileUpdated)],
    });
    consumer.subscribe(STORE_EVENTS.profileUpdated, async (event) => {
      await this.apply.execute(event);
    });
    this.loop = new PollingLoop(consumer, { idleMs: 200, logger: this.logger });
    this.loop.start();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.loop?.stop();
    this.redis?.disconnect();
  }
}
