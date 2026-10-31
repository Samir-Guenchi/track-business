import { Inject, Injectable } from '@nestjs/common';
import type { ScriptLanguage } from '@trackecom/contracts';
import { ORDERS_PORTS, type OrderRepository } from '../../orders/application/ports/orders.ports.js';
import type { OrderRecord } from '../../orders/domain/order.js';
import { fillScript } from '../domain/fill-script.js';
import {
  CONFIRMATION_CONTENT,
  type ConfirmationContentRepository,
} from './ports/confirmation-content.repository.js';
import {
  type CallAttemptRecord,
  CONFIRMATION_REPOSITORY,
  type ConfirmationRepository,
} from './ports/confirmation.repository.js';

export interface QueueItem {
  readonly order: OrderRecord;
  readonly lockedUntil: Date;
  readonly attemptsToday: number;
  readonly previousAttempts: readonly CallAttemptRecord[];
  readonly script: string | null;
}

export interface Claim {
  readonly storeId: string;
  readonly orderId: string;
  readonly lockUntil: Date;
  readonly day: string;
  readonly language: ScriptLanguage;
}

const PREVIOUS_ATTEMPTS = 20;

/** Everything the agent screen shows next to a claimed order. */
@Injectable()
export class QueueItemReader {
  constructor(
    @Inject(CONFIRMATION_REPOSITORY) private readonly repository: ConfirmationRepository,
    @Inject(ORDERS_PORTS.repository) private readonly orders: OrderRepository,
    @Inject(CONFIRMATION_CONTENT) private readonly content: ConfirmationContentRepository,
  ) {}

  async read(claim: Claim): Promise<QueueItem | null> {
    const { storeId, orderId } = claim;
    const [order, state, previousAttempts, script] = await Promise.all([
      this.orders.findById(storeId, orderId),
      this.repository.queueState(storeId, orderId),
      this.repository.attempts(storeId, orderId, PREVIOUS_ATTEMPTS),
      this.content.script(storeId, claim.language),
    ]);
    if (!order || !state) return null;
    return {
      order,
      lockedUntil: claim.lockUntil,
      attemptsToday: state.lastCallDay === claim.day ? state.callsToday : 0,
      previousAttempts,
      script: script === null ? null : fillScript(script, order),
    };
  }
}
