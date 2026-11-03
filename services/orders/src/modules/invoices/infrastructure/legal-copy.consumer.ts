import { hostname } from 'node:os';
import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { STORE_LEGAL_EVENTS } from '@trackecom/contracts';
import { PollingLoop, RedisStreamsConsumer, streamFor } from '@trackecom/events';
import { Redis } from 'ioredis';
import { type Env, ENV } from '../../../config/env.schema.js';
import {
  CopyLegalProfileUseCase,
  LEGAL_COPY_CONSUMER,
} from '../application/copy-legal-profile.use-case.js';

/** Reads identity's stream with its own blocking Redis connection, like the shipping consumer. */
@Injectable()
export class LegalCopyConsumer implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(LegalCopyConsumer.name);
  private redis: Redis | undefined;
  private loop: PollingLoop | undefined;

  constructor(
    private readonly copyLegal: CopyLegalProfileUseCase,
    @Inject(ENV) private readonly env: Env,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.env.WORKERS_ENABLED) return;
    this.redis = new Redis(this.env.REDIS_URL, { maxRetriesPerRequest: null });
    this.redis.on('error', (error: Error) => this.logger.warn(`Redis: ${error.message}`));
    const consumer = new RedisStreamsConsumer(this.redis, {
      group: LEGAL_COPY_CONSUMER,
      consumer: `${hostname()}-${process.pid}`,
      streams: [streamFor(STORE_LEGAL_EVENTS.legalUpdated)],
    });
    consumer.subscribe(STORE_LEGAL_EVENTS.legalUpdated, async (event) => {
      await this.copyLegal.execute(event);
    });
    this.loop = new PollingLoop(consumer, { idleMs: 200, logger: this.logger });
    this.loop.start();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.loop?.stop();
    this.redis?.disconnect();
  }
}
