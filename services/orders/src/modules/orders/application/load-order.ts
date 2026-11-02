import type { OrderRecord } from '../domain/order.js';
import { OrderNotFoundError } from '../domain/order.errors.js';
import type { OrderRepository } from './ports/orders.ports.js';

/** Loads an order of the caller's store; another store's order is reported as not found. */
export async function loadOrder(
  orders: OrderRepository,
  storeId: string,
  id: string,
): Promise<OrderRecord> {
  const order = await orders.findById(storeId, id);
  if (!order) throw new OrderNotFoundError();
  return order;
}

/** The next version of an order: same identity, bumped version and update time. */
export function nextVersion(
  order: OrderRecord,
  changes: Partial<OrderRecord>,
  now: Date,
): OrderRecord {
  return { ...order, ...changes, version: order.version + 1, updatedAt: now };
}
