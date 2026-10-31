import { describe, expect, it } from 'vitest';
import {
  canTransition,
  isTerminal,
  ORDER_STATUSES,
  ORDER_TRANSITIONS,
  type OrderStatus,
} from './order-status.js';

describe('order status machine', () => {
  it.each<[OrderStatus, OrderStatus]>([
    ['new', 'to_confirm'],
    ['to_confirm', 'confirmed'],
    ['to_confirm', 'unreachable'],
    ['unreachable', 'to_confirm'],
    ['postponed', 'confirmed'],
    ['confirmed', 'ready_to_ship'],
    ['ready_to_ship', 'shipped'],
    ['shipped', 'out_for_delivery'],
    ['in_transit', 'delivered'],
    ['out_for_delivery', 'failed_attempt'],
    ['failed_attempt', 'out_for_delivery'],
    ['returning', 'returned'],
  ])('allows %s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it.each<[OrderStatus, OrderStatus]>([
    ['new', 'delivered'],
    ['to_confirm', 'shipped'],
    ['cancelled', 'confirmed'],
    ['delivered', 'returning'],
    ['returned', 'to_confirm'],
    ['shipped', 'cancelled'],
    ['out_for_delivery', 'to_confirm'],
  ])('rejects %s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });

  it('ends only in delivered, cancelled and returned', () => {
    expect(ORDER_STATUSES.filter(isTerminal)).toEqual(['cancelled', 'delivered', 'returned']);
  });

  it('only targets known statuses', () => {
    const targets = Object.values(ORDER_TRANSITIONS).flat();

    expect(targets.every((status) => ORDER_STATUSES.includes(status))).toBe(true);
  });

  it('can reach delivered from new', () => {
    const reachable = new Set<OrderStatus>(['new']);
    for (let changed = true; changed;) {
      const before = reachable.size;
      reachable.forEach((status) => ORDER_TRANSITIONS[status].forEach((to) => reachable.add(to)));
      changed = reachable.size > before;
    }

    expect(reachable.size).toBe(ORDER_STATUSES.length);
  });
});
