import { useQuery } from '@tanstack/react-query';
import { AlgerianPhoneSchema, ORDER_STATUSES, type Order } from '@trackecom/contracts';
import { blacklistApi } from '../api/blacklist-api';
import { ordersApi } from '../api/orders-api';

export interface CustomerHistory {
  readonly count: number;
  readonly delivered: number;
  readonly returned: number;
  readonly lastCustomer: Order['customer'] | undefined;
}

export function historyOf(orders: readonly Order[]): CustomerHistory {
  return {
    count: orders.length,
    delivered: orders.filter((order) => order.status === 'delivered').length,
    returned: orders.filter((order) => order.status === 'returned' || order.status === 'returning')
      .length,
    lastCustomer: orders[0]?.customer,
  };
}

/** Every status, so returned and cancelled orders count too. */
const byPhone = (phone: string) =>
  new URLSearchParams({ q: phone, status: ORDER_STATUSES.join(','), limit: '50' });

/** Past orders and blacklist entry for a phone, once the agent has typed a valid number. */
export function useCustomerLookup(phone: string) {
  const parsed = AlgerianPhoneSchema.safeParse(phone);
  const normalized = parsed.success ? parsed.data : undefined;
  const history = useQuery({
    queryKey: ['orders', 'by-phone', normalized],
    queryFn: () => ordersApi.list(byPhone(normalized ?? '')),
    enabled: normalized !== undefined,
    select: (page) => historyOf(page.items),
  });
  const blacklist = useQuery({
    queryKey: ['blacklist', normalized],
    queryFn: () => blacklistApi.findByPhone(normalized ?? ''),
    enabled: normalized !== undefined,
    select: (page) => page.items[0],
  });
  return { history: history.data, blacklistEntry: blacklist.data };
}
