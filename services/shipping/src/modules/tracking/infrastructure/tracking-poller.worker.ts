import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { type Env, ENV } from '../../../config/env.schema.js';
import { PollingLoop } from '../../../infrastructure/workers/polling-loop.js';
import { TrackingPoller } from '../application/tracking-poller.js';

/** Runs the polling fallback on every replica; the queue's leases keep them from overlapping. */
@Injectable()
export class TrackingPollerWorker implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly loop: PollingLoop;

  constructor(
    poller: TrackingPoller,
    @Inject(ENV) private readonly env: Env,
  ) {
    const task = { name: 'tracking poller', runOnce: () => poller.runOnce() };
    this.loop = new PollingLoop(task, {
      idleMs: 30_000,
      logger: new Logger(TrackingPollerWorker.name),
    });
  }

  onApplicationBootstrap(): void {
    if (this.env.WORKERS_ENABLED) this.loop.start();
  }

  onApplicationShutdown(): Promise<void> {
    return this.loop.stop();
  }
}
