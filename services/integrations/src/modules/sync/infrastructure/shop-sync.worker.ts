import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { PollingLoop } from '@trackecom/events';
import { type Env, ENV } from '../../../config/env.schema.js';
import { ShopSync } from '../application/shop-sync.js';

/** Polls due shops back to back, and checks again every 30 seconds when none is due. */
@Injectable()
export class ShopSyncWorker implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly loop: PollingLoop;

  constructor(
    sync: ShopSync,
    @Inject(ENV) private readonly env: Env,
  ) {
    this.loop = new PollingLoop(sync, { idleMs: 30_000, logger: new Logger(ShopSyncWorker.name) });
  }

  onApplicationBootstrap(): void {
    if (this.env.WORKERS_ENABLED) this.loop.start();
  }

  onApplicationShutdown(): Promise<void> {
    return this.loop.stop();
  }
}
