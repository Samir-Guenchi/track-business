import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { PollingLoop } from '@trackecom/events';
import { type Env, ENV } from '../../../config/env.schema.js';
import { MissingParcelSweep } from '../application/missing-parcel-sweep.js';

/** Looks for overdue parcels every 10 minutes, in batches until none is left. */
@Injectable()
export class MissingParcelWorker implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly loop: PollingLoop;

  constructor(
    sweep: MissingParcelSweep,
    @Inject(ENV) private readonly env: Env,
  ) {
    this.loop = new PollingLoop(sweep, {
      idleMs: 10 * 60_000,
      logger: new Logger(MissingParcelWorker.name),
    });
  }

  onApplicationBootstrap(): void {
    if (this.env.WORKERS_ENABLED) this.loop.start();
  }

  onApplicationShutdown(): Promise<void> {
    return this.loop.stop();
  }
}
