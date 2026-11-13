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
import { CreateShipmentUseCase } from '../application/create-shipment.use-case.js';

export const SHIP_REQUEST_CONSUMER = 'shipping.ship-requests';

/**
 * Reads ship requests from the orders stream with its own Redis connection (XREADGROUP blocks).
 * A carrier call can take a while with retries, so pending messages are reclaimed after 5 min.
 */
@Injectable()
export class ShipRequestConsumer implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(ShipRequestConsumer.name);
  private redis: Redis | undefined;
  private loop: PollingLoop | undefined;

  constructor(
    private readonly createShipment: CreateShipmentUseCase,
    @Inject(ENV) private readonly env: Env,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.env.WORKERS_ENABLED) return;
    this.redis = new Redis(this.env.REDIS_URL, { maxRetriesPerRequest: null });
    this.redis.on('error', (error: Error) => this.logger.warn(`Redis: ${error.message}`));
    const consumer = new RedisStreamsConsumer(this.redis, {
      group: SHIP_REQUEST_CONSUMER,
      consumer: `${hostname()}-${process.pid}`,
      streams: [streamFor(SHIPMENT_EVENTS.shipRequested)],
      claimIdleMs: 5 * 60_000,
    });
    consumer.subscribe(SHIPMENT_EVENTS.shipRequested, async (event) => {
      const result = await this.createShipment.execute(event);
      this.logger.log(`Ship request ${event.id}: ${result}`);
    });
    this.loop = new PollingLoop(consumer, { idleMs: 200, logger: this.logger });
    this.loop.start();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.loop?.stop();
    this.redis?.disconnect();
  }
}
