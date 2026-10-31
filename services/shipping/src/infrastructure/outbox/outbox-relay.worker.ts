import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { OutboxRelay, PollingLoop, RedisStreamsPublisher } from '@trackecom/events';
import { type Env, ENV } from '../../config/env.schema.js';
import { RedisService } from '../redis/redis.service.js';
import { PrismaOutboxStore } from './prisma-outbox.store.js';

/** Moves committed outbox rows to the shipping stream, on every replica. */
@Injectable()
export class OutboxRelayWorker implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly loop: PollingLoop;

  constructor(
    store: PrismaOutboxStore,
    redis: RedisService,
    @Inject(ENV) private readonly env: Env,
  ) {
    const relay = new OutboxRelay(store, new RedisStreamsPublisher(redis));
    const task = { name: 'outbox relay', runOnce: () => relay.runOnce() };
    this.loop = new PollingLoop(task, {
      idleMs: 1_000,
      logger: new Logger(OutboxRelayWorker.name),
    });
  }

  onApplicationBootstrap(): void {
    if (this.env.WORKERS_ENABLED) this.loop.start();
  }

  onApplicationShutdown(): Promise<void> {
    return this.loop.stop();
  }
}
