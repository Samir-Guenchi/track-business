import { Inject, Injectable } from '@nestjs/common';
import { EDITABLE_STATUSES } from '@trackecom/contracts';
import type { OrderRecord } from '../domain/order.js';
import { OrderLockedError } from '../domain/order.errors.js';
import { loadOrder, nextVersion } from './load-order.js';
import type { OrderActor } from './order-actor.js';
import { OrderChangeRecorder } from './order-change.recorder.js';
import { draftFromInput, type OrderInput } from './order-draft.js';
import { ORDERS_PORTS, type OrderRepository } from './ports/orders.ports.js';

/** Replaces customer, items and prices; allowed only before the parcel is prepared. */
@Injectable()
export class UpdateOrderUseCase {
  constructor(
    @Inject(ORDERS_PORTS.repository) private readonly orders: OrderRepository,
    private readonly recorder: OrderChangeRecorder,
  ) {}

  async execute(actor: OrderActor, id: string, input: OrderInput): Promise<OrderRecord> {
    const before = await loadOrder(this.orders, actor.storeId, id);
    if (!EDITABLE_STATUSES.includes(before.status)) throw new OrderLockedError(before.status);
    const after = nextVersion(before, draftFromInput(input, this.recorder.newId), this.recorder.now());
    await this.orders.update(after, this.recorder.effects(actor, { action: 'edited', before, after }));
    return after;
  }
}
