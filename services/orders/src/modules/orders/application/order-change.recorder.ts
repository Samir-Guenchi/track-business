import { Inject, Injectable } from '@nestjs/common';
import { createAuditEntry } from '@trackecom/audit';
import { auditSnapshot, type OrderRecord } from '../domain/order.js';
import type { OrderActor } from './order-actor.js';
import {
  type Clock,
  type IdGenerator,
  type OrderEffects,
  ORDERS_PORTS,
  type OutboxMessage,
} from './ports/orders.ports.js';

export interface ChangeInput {
  readonly action: string;
  readonly before: OrderRecord | null;
  readonly after: OrderRecord;
  readonly extra?: Record<string, unknown>;
  readonly events?: readonly { readonly type: string; readonly data: unknown }[];
}

/** Builds the audit entry and outbox events for one order change, the same way everywhere. */
@Injectable()
export class OrderChangeRecorder {
  constructor(
    @Inject(ORDERS_PORTS.clock) readonly now: Clock,
    @Inject(ORDERS_PORTS.ids) readonly newId: IdGenerator,
  ) {}

  effects(actor: OrderActor, change: ChangeInput): OrderEffects {
    const before = change.before ? auditSnapshot(change.before) : null;
    const after = { ...auditSnapshot(change.after), ...change.extra };
    const audit = createAuditEntry(
      {
        storeId: actor.storeId,
        entity: 'order',
        entityId: change.after.id,
        action: `order.${change.action}`,
        actor: { type: 'user', id: actor.userId },
        before,
        after,
        ip: actor.ip,
      },
      { newId: this.newId, now: this.now },
    );
    return { audit, events: (change.events ?? []).map((event) => this.outbox(actor, event)) };
  }

  private outbox(actor: OrderActor, event: { type: string; data: unknown }): OutboxMessage {
    const id = this.newId();
    const occurredAt = this.now();
    const envelope = {
      id,
      type: event.type,
      occurredAt: occurredAt.toISOString(),
      storeId: actor.storeId,
      correlationId: actor.correlationId,
      data: event.data,
    };
    return {
      id,
      type: event.type,
      storeId: actor.storeId,
      correlationId: actor.correlationId,
      payload: envelope,
      occurredAt,
    };
  }
}
