import { hostname } from 'node:os';
import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { TRACKING_EVENTS } from '@trackecom/contracts';
import { PollingLoop, RedisStreamsConsumer, streamFor } from '@trackecom/events';
import { Redis } from 'ioredis';
import { type Env, ENV } from '../../../config/env.schema.js';
import { FOLLOWUP_CONSUMER } from '../application/followup.ports.js';
import { TrackFollowupsUseCase } from '../application/track-followups.use-case.js';

/** Its own consumer group on shipping's status stream, next to the order-status one. */
@Injectable()
export class FollowupConsumer implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(FollowupConsumer.name);
  private redis: Redis | undefined;
  private loop: PollingLoop | undefined;

  constructor(
    private readonly track: TrackFollowupsUseCase,
    @Inject(ENV) private readonly env: Env,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.env.WORKERS_ENABLED) return;
    this.redis = new Redis(this.env.REDIS_URL, { maxRetriesPerRequest: null });
    this.redis.on('error', (error: Error) => this.logger.warn(`Redis: ${error.message}`));
    const consumer = new RedisStreamsConsumer(this.redis, {
      group: FOLLOWUP_CONSUMER,
      consumer: `${hostname()}-${process.pid}`,
      streams: [streamFor(TRACKING_EVENTS.statusChanged)],
    });
    consumer.subscribe(TRACKING_EVENTS.statusChanged, async (event) => {
      await this.track.execute(event);
    });
    this.loop = new PollingLoop(consumer, { idleMs: 200, logger: this.logger });
    this.loop.start();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.loop?.stop();
    this.redis?.disconnect();
  }
}
