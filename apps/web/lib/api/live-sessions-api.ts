import {
  AddLiveCommentsResponseSchema,
  type CreateLiveSession,
  ListLiveSessionsResponseSchema,
  LiveSessionSchema,
} from '@trackecom/contracts';
import { apiRequest } from './api-client';

const path = (id: string) => `/live-sessions/${encodeURIComponent(id)}`;

/** Live selling sessions (#199), served by the orders service. */
export const liveSessionsApi = {
  list: () => apiRequest({ path: '/live-sessions', schema: ListLiveSessionsResponseSchema }),
  get: (id: string) => apiRequest({ path: path(id), schema: LiveSessionSchema }),
  create: (body: CreateLiveSession) =>
    apiRequest({ path: '/live-sessions', schema: LiveSessionSchema, method: 'POST', body }),
  addComments: (id: string, text: string) =>
    apiRequest({
      path: `${path(id)}/comments`,
      schema: AddLiveCommentsResponseSchema,
      method: 'POST',
      body: { text },
    }),
  linkOrder: (ref: { sessionId: string; reservationId: string }, orderId: string) =>
    apiRequest({
      path: `${path(ref.sessionId)}/reservations/${encodeURIComponent(ref.reservationId)}`,
      schema: LiveSessionSchema,
      method: 'PATCH',
      body: { orderId },
    }),
};
