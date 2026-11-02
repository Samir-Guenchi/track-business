import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { PollingLoop } from '@trackecom/events';
import { type Env, ENV } from '../../../config/env.schema.js';
import { PayoutMatcher } from '../application/payout-matcher.js';

/** Matches imported statements in the background, on every replica (leases keep them apart). */
@Injectable()
export class PayoutMatcherWorker implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly loop: PollingLoop;

  constructor(
    matcher: PayoutMatcher,
    @Inject(ENV) private readonly env: Env,
  ) {
    this.loop = new PollingLoop(matcher, {
      idleMs: 2_000,
      logger: new Logger(PayoutMatcherWorker.name),
    });
  }

  onApplicationBootstrap(): void {
    if (this.env.WORKERS_ENABLED) this.loop.start();
  }

  onApplicationShutdown(): Promise<void> {
    return this.loop.stop();
  }
}
