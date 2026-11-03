import { StuckParcelsResponseSchema } from '@trackecom/contracts';
import { apiRequest } from './api-client';

/** Parcels with no tracking move for too long (#197), served by the shipping service. */
export const stuckParcelsApi = {
  list: (carrier?: string) => {
    const query = new URLSearchParams(carrier ? { carrier } : {});
    return apiRequest({
      path: `/stuck-parcels?${query.toString()}`,
      schema: StuckParcelsResponseSchema,
    });
  },
};
