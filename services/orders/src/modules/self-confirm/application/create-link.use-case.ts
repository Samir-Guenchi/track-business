import { Inject, Injectable } from '@nestjs/common';
import { SELF_CONFIRM_LINK_HOURS } from '@trackecom/contracts';
import { loadOrder } from '../../orders/application/load-order.js';
import type { OrderActor } from '../../orders/application/order-actor.js';
import { OrderChangeRecorder } from '../../orders/application/order-change.recorder.js';
import { ORDERS_PORTS, type OrderRepository } from '../../orders/application/ports/orders.ports.js';
import { LINK_STORE, type LinkStore } from './link-store.port.js';
import { hashToken, newToken } from './token.js';

export interface CreatedLink {
  readonly token: string;
  readonly expiresAt: Date;
}

/** A one-time link the customer opens to answer for themself (#54), sent by SMS or WhatsApp. */
@Injectable()
export class CreateLinkUseCase {
  constructor(
    @Inject(ORDERS_PORTS.repository) private readonly orders: OrderRepository,
    @Inject(LINK_STORE) private readonly links: LinkStore,
    private readonly recorder: OrderChangeRecorder,
  ) {}

  async execute(actor: OrderActor, orderId: string): Promise<CreatedLink> {
    const order = await loadOrder(this.orders, actor.storeId, orderId);
    const now = this.recorder.now();
    const token = newToken();
    const expiresAt = new Date(now.getTime() + SELF_CONFIRM_LINK_HOURS * 3_600_000);
    await this.links.save({
      id: this.recorder.newId(),
      storeId: actor.storeId,
      orderId: order.id,
      tokenHash: hashToken(token),
      expiresAt,
      usedAt: null,
      createdBy: actor.userId,
      createdAt: now,
    });
    return { token, expiresAt };
  }
}
