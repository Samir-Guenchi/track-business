import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  ORDER_EVENTS,
  type OrderStatusChangedEvent,
  type SelfConfirmRequest,
  type SelfConfirmView,
} from '@trackecom/contracts';
import { nextVersion } from '../../orders/application/load-order.js';
import type { OrderActor } from '../../orders/application/order-actor.js';
import { OrderChangeRecorder } from '../../orders/application/order-change.recorder.js';
import { ORDERS_PORTS, type OrderRepository } from '../../orders/application/ports/orders.ports.js';
import type { OrderRecord } from '../../orders/domain/order.js';
import {
  LinkClosedError,
  LinkNotFoundError,
  type LinkRecord,
  answerStatus,
  canAnswer,
} from '../domain/self-confirm.js';
import { LINK_STORE, type LinkStore } from './link-store.port.js';
import { hashToken } from './token.js';

interface Opened {
  readonly link: LinkRecord;
  readonly order: OrderRecord;
}

/** The customer, acting through a link: audited as `system` with the id `customer-link`. */
const customerActor = (link: LinkRecord, ip: string): OrderActor => ({
  storeId: link.storeId,
  userId: 'customer-link',
  role: 'owner',
  ip,
  correlationId: randomUUID(),
  actorType: 'system',
});

const newAddress = (
  order: OrderRecord,
  { wilayaCode, communeId, address }: Extract<SelfConfirmRequest, { action: 'change_address' }>,
): OrderRecord['customer'] => ({ ...order.customer, wilayaCode, communeId, address });

/** What the public self-confirmation page reads and does (#54); the token is the only key. */
@Injectable()
export class SelfConfirmUseCases {
  constructor(
    @Inject(ORDERS_PORTS.repository) private readonly orders: OrderRepository,
    @Inject(LINK_STORE) private readonly links: LinkStore,
    private readonly recorder: OrderChangeRecorder,
  ) {}

  async view(token: string): Promise<SelfConfirmView> {
    const { link, order } = await this.open(token);
    return {
      ref: order.ref,
      status: order.status,
      items: order.items.map(({ name, quantity }) => ({ name, quantity })),
      codAmount: order.codAmount,
      deliveryType: order.deliveryType,
      wilayaCode: order.customer.wilayaCode,
      communeId: order.customer.communeId,
      address: order.customer.address,
      canAnswer: canAnswer(link, order.status, this.recorder.now()),
      expiresAt: link.expiresAt.toISOString(),
    };
  }

  async answer(token: string, request: SelfConfirmRequest, ip: string): Promise<OrderRecord> {
    const { link, order } = await this.open(token);
    const now = this.recorder.now();
    const to = answerStatus(request, order.status);
    if (!canAnswer(link, order.status, now) || !to) throw new LinkClosedError();
    if (!(await this.links.markUsed(link.id, now))) throw new LinkClosedError();
    try {
      const customer =
        request.action === 'change_address' ? newAddress(order, request) : order.customer;
      const after = nextVersion(order, { status: to, statusChangedAt: now, customer }, now);
      await this.save(customerActor(link, ip), { before: order, after, action: request.action });
      return after;
    } catch (error) {
      await this.links.unmarkUsed(link.id);
      throw error;
    }
  }

  private async open(token: string): Promise<Opened> {
    const link = await this.links.findByTokenHash(hashToken(token));
    if (!link || link.expiresAt <= this.recorder.now()) throw new LinkNotFoundError();
    const order = await this.orders.findById(link.storeId, link.orderId);
    if (!order) throw new LinkNotFoundError();
    return { link, order };
  }

  private save(
    actor: OrderActor,
    change: { before: OrderRecord; after: OrderRecord; action: string },
  ): Promise<void> {
    const { before, after } = change;
    const data: OrderStatusChangedEvent = {
      orderId: after.id,
      from: before.status,
      to: after.status,
      actorId: null,
      reason: `customer_${change.action}`,
    };
    const effects = this.recorder.effects(actor, {
      action: 'status_changed',
      before,
      after,
      extra: { reason: data.reason },
      events: [{ type: ORDER_EVENTS.statusChanged, data }],
    });
    return this.orders.update(after, effects);
  }
}
