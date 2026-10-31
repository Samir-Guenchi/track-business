import type { OrderRecord } from '../../orders/domain/order.js';

/** Replaces the placeholders a store can use in its call script with the order's values. */
export function fillScript(body: string, order: OrderRecord): string {
  const values: Record<string, string> = {
    customerName: order.customer.name,
    orderRef: order.ref,
    items: order.items.map((item) => `${item.quantity} x ${item.name}`).join(', '),
    total: `${order.codAmount} DA`,
    wilaya: String(order.customer.wilayaCode),
  };
  return body.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
