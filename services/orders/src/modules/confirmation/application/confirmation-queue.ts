import { Inject, Injectable } from '@nestjs/common';
import { QUEUE_LOCK_SECONDS } from '@trackecom/contracts';
import {
  ORDERS_PORTS,
  type Clock,
  type OrderRepository,
} from '../../orders/application/ports/orders.ports.js';
import type { OrderActor } from '../../orders/application/order-actor.js';
import type { OrderRecord } from '../../orders/domain/order.js';
import { algiersDay } from '../domain/call-plan.js';
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
}

const PREVIOUS_ATTEMPTS = 20;

/** The agent's call queue: oldest first, due call-backs before everything, 5 minute locks. */
@Injectable()
export class ConfirmationQueue {
  constructor(
    @Inject(CONFIRMATION_REPOSITORY) private readonly repository: ConfirmationRepository,
    @Inject(ORDERS_PORTS.repository) private readonly orders: OrderRepository,
    @Inject(ORDERS_PORTS.clock) private readonly now: Clock,
  ) {}

  async next(actor: OrderActor): Promise<QueueItem | null> {
    const settings = await this.repository.settings(actor.storeId);
    const rule =
      settings.assignment === 'rules'
        ? settings.agentRules.find((candidate) => candidate.agentId === actor.userId)
        : undefined;
    const now = this.now();
    const lockUntil = new Date(now.getTime() + QUEUE_LOCK_SECONDS * 1000);
    const day = algiersDay(now);
    const orderId = await this.repository.claimNext({
      storeId: actor.storeId,
      agentId: actor.userId,
      now,
      lockUntil,
      day,
      maxPerDay: settings.maxAttemptsPerDay,
      wilayaCodes: rule?.wilayaCodes ?? [],
      productIds: rule?.productIds ?? [],
    });
    return orderId ? this.describe(actor.storeId, orderId, { lockUntil, day }) : null;
  }

  release(actor: OrderActor, orderId: string): Promise<boolean> {
    return this.repository.release(actor.storeId, orderId, actor.userId);
  }

  private async describe(
    storeId: string,
    orderId: string,
    claim: { lockUntil: Date; day: string },
  ) {
    const [order, state, previousAttempts] = await Promise.all([
      this.orders.findById(storeId, orderId),
      this.repository.queueState(storeId, orderId),
      this.repository.attempts(storeId, orderId, PREVIOUS_ATTEMPTS),
    ]);
    if (!order || !state) return null;
    const attemptsToday = state.lastCallDay === claim.day ? state.callsToday : 0;
    return { order, lockedUntil: claim.lockUntil, attemptsToday, previousAttempts };
  }
}
