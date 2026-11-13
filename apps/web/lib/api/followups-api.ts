import {
  type DecideFollowupRequest,
  DeliveryFollowupSchema,
  FollowupMetricsResponseSchema,
  ListFollowupsResponseSchema,
} from '@trackecom/contracts';
import { apiRequest } from './api-client';

/** Failed-delivery follow-ups (#132), served by the orders service. */
export const followupsApi = {
  list: (query: URLSearchParams) =>
    apiRequest({
      path: `/orders/followups?${query.toString()}`,
      schema: ListFollowupsResponseSchema,
    }),
  metrics: () =>
    apiRequest({ path: '/orders/followups/metrics', schema: FollowupMetricsResponseSchema }),
  decide: (id: string, body: DecideFollowupRequest) =>
    apiRequest({
      path: `/orders/followups/${encodeURIComponent(id)}/decision`,
      schema: DeliveryFollowupSchema,
      method: 'POST',
      body,
    }),
};
