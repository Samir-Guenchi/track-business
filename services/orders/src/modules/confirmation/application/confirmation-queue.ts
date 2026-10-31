import { Inject, Injectable } from '@nestjs/common';
import { QUEUE_LOCK_SECONDS, type ScriptLanguage } from '@trackecom/contracts';
import type { OrderActor } from '../../orders/application/order-actor.js';
import { type Clock, ORDERS_PORTS } from '../../orders/application/ports/orders.ports.js';
import { algiersDay } from '../domain/call-plan.js';
import {
  CONFIRMATION_REPOSITORY,
  type ConfirmationRepository,
} from './ports/confirmation.repository.js';
import { type QueueItem, QueueItemReader } from './queue-item.reader.js';

/** The agent's call queue: oldest first, due call-backs before everything, 5 minute locks. */
@Injectable()
export class ConfirmationQueue {
  constructor(
    @Inject(CONFIRMATION_REPOSITORY) private readonly repository: ConfirmationRepository,
    @Inject(ORDERS_PORTS.clock) private readonly now: Clock,
    private readonly items: QueueItemReader,
  ) {}

  async next(actor: OrderActor, language: ScriptLanguage): Promise<QueueItem | null> {
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
    if (!orderId) return null;
    return this.items.read({ storeId: actor.storeId, orderId, lockUntil, day, language });
  }

  release(actor: OrderActor, orderId: string): Promise<boolean> {
    return this.repository.release(actor.storeId, orderId, actor.userId);
  }
}
