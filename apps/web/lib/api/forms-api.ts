import {
  type CreateOrderFormInput,
  ListOrderFormsResponseSchema,
  OrderFormSchema,
} from '@trackecom/contracts';
import { apiRequest } from './api-client';

/** The seller's COD order forms (#134), served by the orders service. */
export const formsApi = {
  list: () => apiRequest({ path: '/orders/forms', schema: ListOrderFormsResponseSchema }),
  create: (body: CreateOrderFormInput) =>
    apiRequest({ path: '/orders/forms', schema: OrderFormSchema, method: 'POST', body }),
  update: (id: string, body: CreateOrderFormInput & { enabled: boolean }) =>
    apiRequest({
      path: `/orders/forms/${encodeURIComponent(id)}`,
      schema: OrderFormSchema,
      method: 'PUT',
      body,
    }),
};
