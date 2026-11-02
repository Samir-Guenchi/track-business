import {
  DeliveryRequestSchema,
  type DeliveryRequestState,
  ListDeliveryRequestsResponseSchema,
  type UpdateDeliveryRequest,
} from '@trackecom/contracts';
import { apiRequest } from './api-client';

export interface DeliveryRequestFilter {
  readonly state?: DeliveryRequestState;
  readonly orderId?: string;
}

/** Customer delivery requests (#136), served by the shipping service. */
export const deliveryRequestsApi = {
  list: (filter: DeliveryRequestFilter) => {
    const query = new URLSearchParams({ limit: '100' });
    if (filter.state) query.set('state', filter.state);
    if (filter.orderId) query.set('orderId', filter.orderId);
    return apiRequest({
      path: `/delivery-requests?${query.toString()}`,
      schema: ListDeliveryRequestsResponseSchema,
    });
  },
  update: (id: string, body: UpdateDeliveryRequest) =>
    apiRequest({
      path: `/delivery-requests/${encodeURIComponent(id)}`,
      schema: DeliveryRequestSchema,
      method: 'PATCH',
      body,
    }),
};
