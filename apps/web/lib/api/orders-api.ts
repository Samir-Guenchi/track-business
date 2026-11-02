import {
  type BulkOrdersRequest,
  BulkOrdersResponseSchema,
  type ChangeStatusRequest,
  type CreateOrderRequest,
  ListOrdersResponseSchema,
  OrderHistoryResponseSchema,
  OrderSchema,
} from '@trackecom/contracts';
import { apiRequest } from './api-client';

const orderPath = (id: string) => `/orders/${encodeURIComponent(id)}`;

/** Calls to the orders service through the gateway; the store comes from `x-store-id`. */
export const ordersApi = {
  list: (query: URLSearchParams) =>
    apiRequest({ path: `/orders?${query.toString()}`, schema: ListOrdersResponseSchema }),
  create: (body: CreateOrderRequest) =>
    apiRequest({ path: '/orders', schema: OrderSchema, method: 'POST', body }),
  get: (id: string) => apiRequest({ path: orderPath(id), schema: OrderSchema }),
  history: (id: string) =>
    apiRequest({ path: `${orderPath(id)}/history`, schema: OrderHistoryResponseSchema }),
  changeStatus: (id: string, body: ChangeStatusRequest) =>
    apiRequest({ path: `${orderPath(id)}/status`, schema: OrderSchema, method: 'POST', body }),
  bulk: (body: BulkOrdersRequest) =>
    apiRequest({ path: '/orders/bulk', schema: BulkOrdersResponseSchema, method: 'POST', body }),
};
