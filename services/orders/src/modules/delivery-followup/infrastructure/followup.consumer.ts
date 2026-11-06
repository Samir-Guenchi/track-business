import { hostname } from 'node:os';
import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { ATTEMPT_CHECK_EVENTS, TRACKING_EVENTS } from '@trackecom/contracts';
import { PollingLoop, RedisStreamsConsumer, streamFor } from '@trackecom/events';
import { Redis } from 'ioredis';
import { type Env, ENV } from '../../../config/env.schema.js';
import { DisputeFollowupUseCase } from '../application/dispute-followup.use-case.js';
import { FOLLOWUP_CONSUMER } from '../application/followup.ports.js';
import { TrackFollowupsUseCase } from '../application/track-followups.use-case.js';

/**
 * Its own consumer group on shipping's status stream, next to the order-status one, and on the
 * attempt disputes customers send from the tracking page (#195).
 */
@Injectable()
export class FollowupConsumer implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(FollowupConsumer.name);
  private redis: Redis | undefined;
  private loop: PollingLoop | undefined;

  constructor(
    private readonly track: TrackFollowupsUseCase,
    private readonly dispute: DisputeFollowupUseCase,
    @Inject(ENV) private readonly env: Env,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.env.WORKERS_ENABLED) return;
    this.redis = new Redis(this.env.REDIS_URL, { maxRetriesPerRequest: null });
    this.redis.on('error', (error: Error) => this.logger.warn(`Redis: ${error.message}`));
    const consumer = new RedisStreamsConsumer(this.redis, {
      group: FOLLOWUP_CONSUMER,
      consumer: `${hostname()}-${process.pid}`,
      streams: [streamFor(TRACKING_EVENTS.statusChanged), streamFor(ATTEMPT_CHECK_EVENTS.disputed)],
    });
    consumer.subscribe(TRACKING_EVENTS.statusChanged, async (event) => {
      await this.track.execute(event);
    });
    consumer.subscribe(ATTEMPT_CHECK_EVENTS.disputed, async (event) => {
      await this.dispute.execute(event);
    });
    this.loop = new PollingLoop(consumer, { idleMs: 200, logger: this.logger });
    this.loop.start();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.loop?.stop();
    this.redis?.disconnect();
  }
}
