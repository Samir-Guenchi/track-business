import {
  type DecideReturnRequest,
  ListReturnRequestsResponseSchema,
  type ReturnRequestState,
  SellerReturnRequestSchema,
} from '@trackecom/contracts';
import { apiRequest } from './api-client';

/** Return and exchange requests from tracking links (#201), served by the shipping service. */
export const returnRequestsApi = {
  list: (state?: ReturnRequestState) => {
    const query = new URLSearchParams(state ? { state } : {});
    return apiRequest({
      path: `/return-requests?${query.toString()}`,
      schema: ListReturnRequestsResponseSchema,
    });
  },
  decide: (id: string, body: DecideReturnRequest) =>
    apiRequest({
      path: `/return-requests/${encodeURIComponent(id)}`,
      schema: SellerReturnRequestSchema,
      method: 'PATCH',
      body,
    }),
};
