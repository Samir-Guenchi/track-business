import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChangeStatusRequest } from '@trackecom/contracts';
import { ordersApi } from '../api/orders-api';
import { listQueryOf, type OrderFilters } from './order-filters';

export const orderKeys = {
  all: ['orders'] as const,
  list: (filters: OrderFilters) => ['orders', 'list', filters] as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
  history: (id: string) => ['orders', 'history', id] as const,
};

export function useOrdersList(filters: OrderFilters) {
  return useInfiniteQuery({
    queryKey: orderKeys.list(filters),
    queryFn: ({ pageParam }) => ordersApi.list(listQueryOf(filters, pageParam)),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}

export function useOrder(id: string) {
  return useQuery({ queryKey: orderKeys.detail(id), queryFn: () => ordersApi.get(id) });
}

export function useOrderHistory(id: string) {
  return useQuery({ queryKey: orderKeys.history(id), queryFn: () => ordersApi.history(id) });
}

/** Status change from the list, the shortcuts or the detail page; refreshes every order view. */
export function useChangeStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: ChangeStatusRequest & { id: string }) =>
      ordersApi.changeStatus(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orderKeys.all }),
  });
}

export function useBulkStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderIds, status }: { orderIds: string[]; status: 'confirmed' | 'cancelled' }) =>
      ordersApi.bulk({ action: 'change_status', orderIds, status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orderKeys.all }),
  });
}
