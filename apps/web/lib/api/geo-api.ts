import { ListCommunesResponseSchema, ListWilayasResponseSchema } from '@trackecom/contracts';
import { apiRequest } from './api-client';

export const geoApi = {
  wilayas: () => apiRequest({ path: '/geo/wilayas', schema: ListWilayasResponseSchema }),
  communes: (wilayaCode: number) =>
    apiRequest({ path: `/geo/wilayas/${wilayaCode}/communes`, schema: ListCommunesResponseSchema }),
};
