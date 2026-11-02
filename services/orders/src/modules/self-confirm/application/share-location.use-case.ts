import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { ShareLocationRequest } from '@trackecom/contracts';
import { nextVersion } from '../../orders/application/load-order.js';
import type { OrderActor } from '../../orders/application/order-actor.js';
import { OrderChangeRecorder } from '../../orders/application/order-change.recorder.js';
import { ORDERS_PORTS, type OrderRepository } from '../../orders/application/ports/orders.ports.js';
import { type OrderRecord, resolvePin } from '../../orders/domain/order.js';
import { LinkClosedError, canShareLocation } from '../domain/self-confirm.js';
import { SelfConfirmUseCases } from './self-confirm.use-cases.js';

/**
 * The customer drops a map pin from their link (#135), with an optional landmark. It changes no
 * status, so it works after confirmation too, until the link expires or the parcel is closed.
 */
@Injectable()
export class ShareLocationUseCase {
  constructor(
    private readonly links: SelfConfirmUseCases,
    @Inject(ORDERS_PORTS.repository) private readonly orders: OrderRepository,
    private readonly recorder: OrderChangeRecorder,
  ) {}

  async execute(token: string, request: ShareLocationRequest, ip: string): Promise<OrderRecord> {
    const { link, order } = await this.links.open(token);
    const now = this.recorder.now();
    if (!canShareLocation(link, order.status, now)) throw new LinkClosedError();
    const { landmark, ...point } = request;
    const location = resolvePin(point, { now, previous: null, source: 'customer' });
    const customer = { ...order.customer, location, landmark: landmark ?? order.customer.landmark };
    const after = nextVersion(order, { customer }, now);
    const actor: OrderActor = {
      storeId: link.storeId,
      userId: 'customer-link',
      role: 'owner',
      ip,
      correlationId: randomUUID(),
      actorType: 'system',
    };
    await this.orders.update(
      after,
      this.recorder.effects(actor, { action: 'location_shared', before: order, after }),
    );
    return after;
  }
}
