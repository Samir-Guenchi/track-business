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
import {
  ApplyShipmentStatusUseCase,
  SHIPMENT_STATUS_CONSUMER,
} from '../application/apply-shipment-status.use-case.js';

/**
 * Reads shipping's stream with its own Redis connection (XREADGROUP blocks, so it must not share
 * the request-path connection). One consumer group for all replicas of orders.
 */
@Injectable()
export class ShipmentStatusConsumer implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(ShipmentStatusConsumer.name);
  private redis: Redis | undefined;
  private loop: PollingLoop | undefined;

  constructor(
    private readonly apply: ApplyShipmentStatusUseCase,
    @Inject(ENV) private readonly env: Env,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.env.WORKERS_ENABLED) return;
    this.redis = new Redis(this.env.REDIS_URL, { maxRetriesPerRequest: null });
    this.redis.on('error', (error: Error) => this.logger.warn(`Redis: ${error.message}`));
    const consumer = new RedisStreamsConsumer(this.redis, {
      group: SHIPMENT_STATUS_CONSUMER,
      consumer: `${hostname()}-${process.pid}`,
      streams: [streamFor(TRACKING_EVENTS.statusChanged)],
    });
    consumer.subscribe(TRACKING_EVENTS.statusChanged, async (event) => {
      await this.apply.execute(event);
    });
    let ready = false;
    const runOnce = async () => {
      if (!ready) await consumer.init();
      ready = true;
      return consumer.pollOnce();
    };
    this.loop = new PollingLoop(
      { name: 'shipment status consumer', runOnce },
      { idleMs: 200, logger: this.logger },
    );
    this.loop.start();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.loop?.stop();
    this.redis?.disconnect();
  }
}
