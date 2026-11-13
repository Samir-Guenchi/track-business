import type { OrderStatus } from '@trackecom/contracts';

/** Tabs of the orders screen. Each groups the statuses an agent handles the same way. */
export const STATUS_TABS = {
  to_confirm: ['new', 'to_confirm', 'unreachable', 'postponed'],
  to_ship: ['confirmed', 'ready_to_ship'],
  on_the_way: ['shipped', 'in_transit', 'out_for_delivery', 'failed_attempt'],
  delivered: ['delivered'],
  returns: ['returning', 'returned'],
  cancelled: ['cancelled'],
  all: [],
} as const satisfies Record<string, readonly OrderStatus[]>;

export type StatusTab = keyof typeof STATUS_TABS;

export const STATUS_TAB_KEYS = Object.keys(STATUS_TABS) as StatusTab[];

export function isStatusTab(value: string | null): value is StatusTab {
  return value !== null && value in STATUS_TABS;
}

/** The `status` query value for a tab, or undefined for "all". */
export function statusFilterOf(tab: StatusTab): string | undefined {
  const statuses: readonly OrderStatus[] = STATUS_TABS[tab];
  return statuses.length > 0 ? statuses.join(',') : undefined;
}
