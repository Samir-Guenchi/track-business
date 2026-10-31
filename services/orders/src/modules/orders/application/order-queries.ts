import { Inject, Injectable } from '@nestjs/common';
import { AUDIT_TRAIL_READER, type AuditTrailReader } from '@trackecom/audit';
import {
  type AuditEvent,
  type ListOrdersQuery,
  type OrderHistoryEntry,
  OrderStatusSchema,
} from '@trackecom/contracts';
import type { OrderRecord } from '../domain/order.js';
import { loadOrder } from './load-order.js';
import { ORDERS_PORTS, type OrderPage, type OrderRepository } from './ports/orders.ports.js';

const HISTORY_LIMIT = 100;
const KINDS: Record<string, OrderHistoryEntry['kind']> = {
  'order.created': 'created',
  'order.edited': 'edited',
  'order.status_changed': 'status_changed',
  'order.assigned': 'assigned',
  'order.tagged': 'tagged',
  'order.untagged': 'tagged',
  'order.deleted': 'deleted',
};

const statusOf = (value: unknown) => OrderStatusSchema.safeParse(value).data ?? null;

function toHistoryEntry(event: AuditEvent): OrderHistoryEntry {
  const status = event.changes.find((change) => change.field === 'status');
  const reason = event.changes.find((change) => change.field === 'reason')?.after;
  return {
    id: event.id,
    at: event.occurredAt,
    actorId: event.actor.type === 'user' ? event.actor.id : null,
    kind: KINDS[event.action] ?? 'edited',
    fromStatus: statusOf(status?.before),
    toStatus: statusOf(status?.after),
    note: typeof reason === 'string' ? reason : null,
  };
}

@Injectable()
export class OrderQueries {
  constructor(
    @Inject(ORDERS_PORTS.repository) private readonly orders: OrderRepository,
    @Inject(AUDIT_TRAIL_READER) private readonly audit: AuditTrailReader,
  ) {}

  get(storeId: string, id: string): Promise<OrderRecord> {
    return loadOrder(this.orders, storeId, id);
  }

  list(storeId: string, query: ListOrdersQuery): Promise<OrderPage> {
    return this.orders.list(storeId, query);
  }

  /** The last 100 changes, newest first, read from the order's audit trail. */
  async history(storeId: string, id: string): Promise<OrderHistoryEntry[]> {
    await loadOrder(this.orders, storeId, id);
    const page = await this.audit.list({
      storeId,
      entity: 'order',
      entityId: id,
      limit: HISTORY_LIMIT,
    });
    return page.items.map(toHistoryEntry);
  }
}
