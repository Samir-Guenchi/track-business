import { Inject, Injectable } from '@nestjs/common';
import { EDITABLE_STATUSES, ORDER_EVENTS } from '@trackecom/contracts';
import type { OrderRecord } from '../domain/order.js';
import { OrderLockedError } from '../domain/order.errors.js';
import { loadOrder, nextVersion } from './load-order.js';
import type { OrderActor } from './order-actor.js';
import { OrderChangeRecorder } from './order-change.recorder.js';
import { ORDERS_PORTS, type OrderRepository } from './ports/orders.ports.js';

const MAX_TAGS = 10;

interface SmallEdit {
  readonly id: string;
  readonly action: string;
  readonly edit: (order: OrderRecord) => Partial<OrderRecord>;
}

/** Small edits that do not touch items or prices: agent, tags, deletion. */
@Injectable()
export class OrderAdminUseCases {
  constructor(
    @Inject(ORDERS_PORTS.repository) private readonly orders: OrderRepository,
    private readonly recorder: OrderChangeRecorder,
  ) {}

  /** The agent must be a store member; the confirmation queue (#28) checks it when assigning work. */
  assignAgent(actor: OrderActor, id: string, agentId: string | null): Promise<OrderRecord> {
    return this.change(actor, {
      id,
      action: 'assigned',
      edit: () => ({ assignedAgentId: agentId }),
    });
  }

  addTag(actor: OrderActor, id: string, tag: string): Promise<OrderRecord> {
    return this.change(actor, {
      id,
      action: 'tagged',
      edit: (order) => ({
        tags: order.tags.includes(tag) ? order.tags : [...order.tags, tag].slice(0, MAX_TAGS),
      }),
    });
  }

  removeTag(actor: OrderActor, id: string, tag: string): Promise<OrderRecord> {
    return this.change(actor, {
      id,
      action: 'untagged',
      edit: (order) => ({ tags: order.tags.filter((existing) => existing !== tag) }),
    });
  }

  /** Soft delete, only before shipping (or once cancelled): money never disappears silently. */
  async delete(actor: OrderActor, id: string): Promise<void> {
    const before = await loadOrder(this.orders, actor.storeId, id);
    if (!EDITABLE_STATUSES.includes(before.status) && before.status !== 'cancelled')
      throw new OrderLockedError(before.status);
    const after = nextVersion(before, {}, this.recorder.now());
    const events = [{ type: ORDER_EVENTS.deleted, data: { orderId: id } }];
    await this.orders.softDelete(
      after,
      this.recorder.effects(actor, { action: 'deleted', before, after, events }),
    );
  }

  private async change(actor: OrderActor, request: SmallEdit): Promise<OrderRecord> {
    const { id, action, edit } = request;
    const before = await loadOrder(this.orders, actor.storeId, id);
    const after = nextVersion(before, edit(before), this.recorder.now());
    await this.orders.update(after, this.recorder.effects(actor, { action, before, after }));
    return after;
  }
}
