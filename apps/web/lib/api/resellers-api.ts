import {
  ListResellerOrdersResponseSchema,
  ListResellersResponseSchema,
  ResellerCatalogueSchema,
  type ResellerInput,
  ResellerPayoutResponseSchema,
  type ResellerProductInput,
  ResellerProductSchema,
  ResellerSchema,
} from '@trackecom/contracts';
import { apiRequest } from './api-client';

const reseller = (id: string) => `/resellers/${encodeURIComponent(id)}`;

/** Resellers and their catalogue (#198), served by the orders service. */
export const resellersApi = {
  list: () => apiRequest({ path: '/resellers', schema: ListResellersResponseSchema }),
  create: (body: ResellerInput) =>
    apiRequest({ path: '/resellers', schema: ResellerSchema, method: 'POST', body }),
  update: (id: string, body: ResellerInput) =>
    apiRequest({ path: reseller(id), schema: ResellerSchema, method: 'PATCH', body }),
  orders: (id: string) =>
    apiRequest({ path: `${reseller(id)}/orders`, schema: ListResellerOrdersResponseSchema }),
  payout: (id: string) =>
    apiRequest({
      path: `${reseller(id)}/payout`,
      schema: ResellerPayoutResponseSchema,
      method: 'POST',
    }),
  catalogue: () => apiRequest({ path: '/resellers/catalogue', schema: ResellerCatalogueSchema }),
  addProduct: (body: ResellerProductInput) =>
    apiRequest({
      path: '/resellers/catalogue',
      schema: ResellerProductSchema,
      method: 'POST',
      body,
    }),
  updateProduct: (id: string, body: ResellerProductInput) =>
    apiRequest({
      path: `/resellers/catalogue/${encodeURIComponent(id)}`,
      schema: ResellerProductSchema,
      method: 'PATCH',
      body,
    }),
};
