import {
  HandoverResponseSchema,
  ListPickupParcelsResponseSchema,
  ListPickupPointsResponseSchema,
  type PickupParcelState,
  type PickupPointInput,
  PickupPointSchema,
  PickupStatementSchema,
  type ReleaseParcel,
} from '@trackecom/contracts';
import { apiRequest } from './api-client';

const point = (id: string) => `/pickup-points/${encodeURIComponent(id)}`;

/** Partner pickup points (#202), served by the shipping service. */
export const pickupPointsApi = {
  list: () => apiRequest({ path: '/pickup-points', schema: ListPickupPointsResponseSchema }),
  create: (body: PickupPointInput) =>
    apiRequest({ path: '/pickup-points', schema: PickupPointSchema, method: 'POST', body }),
  update: (id: string, body: PickupPointInput) =>
    apiRequest({ path: point(id), schema: PickupPointSchema, method: 'PATCH', body }),
  parcels: (id: string, state?: PickupParcelState) =>
    apiRequest({
      path: `${point(id)}/parcels?${new URLSearchParams(state ? { state } : {}).toString()}`,
      schema: ListPickupParcelsResponseSchema,
    }),
  drop: (id: string, trackingNumber: string) =>
    apiRequest({
      path: `${point(id)}/parcels`,
      schema: ListPickupParcelsResponseSchema,
      method: 'POST',
      body: { trackingNumber },
    }),
  release: (id: string, shipmentId: string, body: ReleaseParcel) =>
    apiRequest({
      path: `${point(id)}/parcels/${encodeURIComponent(shipmentId)}/release`,
      schema: ListPickupParcelsResponseSchema,
      method: 'POST',
      body,
    }),
  handover: (id: string) =>
    apiRequest({ path: `${point(id)}/handover`, schema: HandoverResponseSchema, method: 'POST' }),
  statement: (id: string, month: string) =>
    apiRequest({
      path: `${point(id)}/statement?month=${encodeURIComponent(month)}`,
      schema: PickupStatementSchema,
    }),
};
