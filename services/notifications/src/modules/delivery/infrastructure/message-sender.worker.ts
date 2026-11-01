import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { PollingLoop } from '@trackecom/events';
import { type Env, ENV } from '../../../config/env.schema.js';
import { MessageSender } from '../application/message-sender.js';

/** Runs the sender loop on every replica; leases keep replicas apart. */
@Injectable()
export class MessageSenderWorker implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly loop: PollingLoop;

  constructor(
    sender: MessageSender,
    @Inject(ENV) private readonly env: Env,
  ) {
    this.loop = new PollingLoop(sender, {
      idleMs: 2_000,
      logger: new Logger(MessageSenderWorker.name),
    });
  }

  onApplicationBootstrap(): void {
    if (this.env.WORKERS_ENABLED) this.loop.start();
  }

  onApplicationShutdown(): Promise<void> {
    return this.loop.stop();
  }
}
