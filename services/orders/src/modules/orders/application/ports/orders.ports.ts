import type { AuditEntry } from '@trackecom/audit';
import type { ListOrdersQuery, OrderSource } from '@trackecom/contracts';
import type { OrderRecord } from '../../domain/order.js';

/** One outbox row, written in the same transaction as the change it announces. */
export interface OutboxMessage {
  readonly id: string;
  readonly type: string;
  readonly storeId: string;
  readonly correlationId: string;
  readonly payload: unknown;
  readonly occurredAt: Date;
}

/** Side effects committed atomically with an order write. */
export interface OrderEffects {
  readonly audit: AuditEntry;
  readonly events: readonly OutboxMessage[];
  /** The bus event this change applies; recorded once, so a redelivery is refused. */
  readonly consumed?: { readonly consumer: string; readonly eventId: string };
}

export interface OrderPage {
  readonly items: readonly OrderRecord[];
  readonly nextCursor: string | null;
}

export interface OrderRepository {
  findById(storeId: string, id: string): Promise<OrderRecord | null>;
  findIdByExternalRef(storeId: string, source: OrderSource, ref: string): Promise<string | null>;
  findRecentDuplicate(order: OrderRecord, since: Date): Promise<string | null>;
  /** Throws RefTakenError when the generated ref already exists in the store. */
  insert(order: OrderRecord, effects: OrderEffects): Promise<void>;
  /** Writes only if the stored version is still `order.version - 1`, else OrderConflictError. */
  update(order: OrderRecord, effects: OrderEffects): Promise<void>;
  softDelete(order: OrderRecord, effects: OrderEffects): Promise<void>;
  list(storeId: string, query: ListOrdersQuery): Promise<OrderPage>;
}

export class RefTakenError extends Error {}

export type Clock = () => Date;
export type IdGenerator = () => string;

export const ORDERS_PORTS = {
  repository: Symbol('OrderRepository'),
  clock: Symbol('Clock'),
  ids: Symbol('IdGenerator'),
} as const;
