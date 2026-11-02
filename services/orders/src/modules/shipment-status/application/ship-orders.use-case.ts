import { Inject, Injectable } from '@nestjs/common';
import {
  ORDER_EVENTS,
  SHIPMENT_EVENTS,
  type ShipOrderResult,
  type ShipOrdersRequest,
  type ShipOrdersResponse,
  roleCan,
} from '@trackecom/contracts';
import { AccessDeniedError, DomainError } from '@trackecom/service-kit';
import { loadOrder, nextVersion } from '../../orders/application/load-order.js';
import type { OrderActor } from '../../orders/application/order-actor.js';
import { OrderChangeRecorder } from '../../orders/application/order-change.recorder.js';
import { ORDERS_PORTS, type OrderRepository } from '../../orders/application/ports/orders.ports.js';
import { IllegalTransitionError } from '../../orders/domain/order.errors.js';
import { toShipRequested } from '../domain/ship-request.js';

/**
 * The "Ship" bulk action (#31): confirmed orders go to `ready_to_ship` and a ship request goes to
 * shipping in the same transaction. Only confirmed orders qualify, so an order with a request in
 * flight is never sent twice; a refused request brings the order back to `confirmed`.
 */
@Injectable()
export class ShipOrdersUseCase {
  constructor(
    @Inject(ORDERS_PORTS.repository) private readonly orders: OrderRepository,
    private readonly recorder: OrderChangeRecorder,
  ) {}

  async execute(actor: OrderActor, request: ShipOrdersRequest): Promise<ShipOrdersResponse> {
    if (!roleCan(actor.role, 'shipments.manage')) throw new AccessDeniedError();
    const items: ShipOrderResult[] = [];
    for (const orderId of new Set(request.orderIds)) {
      items.push(await this.shipOne(actor, orderId, request));
    }
    return { items };
  }

  private async shipOne(
    actor: OrderActor,
    orderId: string,
    request: ShipOrdersRequest,
  ): Promise<ShipOrderResult> {
    try {
      await this.requestParcel(actor, orderId, request);
      return { orderId, status: 'requested' };
    } catch (error) {
      if (!(error instanceof DomainError)) throw error;
      return { orderId, status: 'skipped', code: error.code };
    }
  }

  private async requestParcel(actor: OrderActor, id: string, request: ShipOrdersRequest) {
    const before = await loadOrder(this.orders, actor.storeId, id);
    if (before.status !== 'confirmed')
      throw new IllegalTransitionError(before.status, 'ready_to_ship');
    const now = this.recorder.now();
    const after = nextVersion(before, { status: 'ready_to_ship', statusChangedAt: now }, now);
    const statusChanged = {
      orderId: id,
      from: before.status,
      to: after.status,
      actorId: actor.userId,
      reason: null,
    };
    const effects = this.recorder.effects(actor, {
      action: 'ship_requested',
      before,
      after,
      extra: { carrier: request.carrier },
      events: [
        { type: ORDER_EVENTS.statusChanged, data: statusChanged },
        { type: SHIPMENT_EVENTS.shipRequested, data: toShipRequested(after, request) },
      ],
    });
    await this.orders.update(after, effects);
  }
}
