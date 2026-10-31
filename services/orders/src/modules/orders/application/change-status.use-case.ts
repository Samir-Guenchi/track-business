import { Inject, Injectable } from '@nestjs/common';
import {
  type ChangeStatusRequest,
  ORDER_EVENTS,
  canTransition,
  roleCan,
} from '@trackecom/contracts';
import { type OrderRecord, permissionToSet } from '../domain/order.js';
import { IllegalTransitionError, StatusPermissionError } from '../domain/order.errors.js';
import { loadOrder, nextVersion } from './load-order.js';
import type { OrderActor } from './order-actor.js';
import { OrderChangeRecorder } from './order-change.recorder.js';
import { ORDERS_PORTS, type OrderRepository } from './ports/orders.ports.js';

/** Moves an order through the status machine (packages/contracts/src/orders/order-status.ts). */
@Injectable()
export class ChangeStatusUseCase {
  constructor(
    @Inject(ORDERS_PORTS.repository) private readonly orders: OrderRepository,
    private readonly recorder: OrderChangeRecorder,
  ) {}

  async execute(actor: OrderActor, id: string, request: ChangeStatusRequest): Promise<OrderRecord> {
    const { status, reason } = request;
    if (!roleCan(actor.role, permissionToSet(status))) throw new StatusPermissionError(status);
    const before = await loadOrder(this.orders, actor.storeId, id);
    if (!canTransition(before.status, status)) throw new IllegalTransitionError(before.status, status);
    const now = this.recorder.now();
    const postponedUntil = status === 'postponed' ? new Date(request.postponedUntil ?? now) : null;
    const after = nextVersion(before, { status, postponedUntil, statusChangedAt: now }, now);
    const data = {
      orderId: id,
      from: before.status,
      to: status,
      actorId: actor.userId,
      reason: reason ?? null,
    };
    const effects = this.recorder.effects(actor, {
      action: 'status_changed',
      before,
      after,
      extra: { reason: reason ?? null },
      events: [{ type: ORDER_EVENTS.statusChanged, data }],
    });
    await this.orders.update(after, effects);
    return after;
  }
}
