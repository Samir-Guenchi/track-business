import { z } from 'zod';

/** Lifecycle of an order, from import to delivery or return. Shared by API, web and mobile. */
export const ORDER_STATUSES = [
  'new',
  'to_confirm',
  'confirmed',
  'cancelled',
  'unreachable',
  'postponed',
  'ready_to_ship',
  'shipped',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'failed_attempt',
  'returning',
  'returned',
] as const;

export const OrderStatusSchema = z.enum(ORDER_STATUSES);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

/**
 * Allowed moves. Confirmation outcomes can be retried (unreachable -> to_confirm), carriers may
 * skip intermediate scans (shipped -> out_for_delivery), and stop-desk pickups go straight from
 * in_transit to delivered. Anything not listed is rejected.
 */
export const ORDER_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  new: ['to_confirm', 'confirmed', 'cancelled'],
  to_confirm: ['confirmed', 'cancelled', 'unreachable', 'postponed'],
  unreachable: ['to_confirm', 'confirmed', 'cancelled', 'unreachable'],
  postponed: ['to_confirm', 'confirmed', 'cancelled'],
  confirmed: ['ready_to_ship', 'cancelled', 'to_confirm'],
  ready_to_ship: ['shipped', 'confirmed', 'cancelled'],
  shipped: ['in_transit', 'out_for_delivery', 'returning'],
  in_transit: ['out_for_delivery', 'delivered', 'returning'],
  out_for_delivery: ['delivered', 'failed_attempt', 'returning'],
  failed_attempt: ['out_for_delivery', 'returning'],
  returning: ['returned'],
  delivered: [],
  cancelled: [],
  returned: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

/** Final states: the order no longer moves and can no longer be edited. */
export function isTerminal(status: OrderStatus): boolean {
  return ORDER_TRANSITIONS[status].length === 0;
}

/** Before the parcel leaves: items, customer and prices can still be edited. */
export const EDITABLE_STATUSES: readonly OrderStatus[] = [
  'new',
  'to_confirm',
  'unreachable',
  'postponed',
  'confirmed',
];
