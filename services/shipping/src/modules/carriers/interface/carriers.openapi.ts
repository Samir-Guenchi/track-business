import {
  AvailableCarriersResponseSchema,
  CarrierAccountSchema,
  CarrierAccountsResponseSchema,
  CarrierCodeSchema,
  ConnectCarrierRequestSchema,
} from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { z } from 'zod';

const json = (description: string, schema: z.ZodType) => ({
  '200': { description, content: { 'application/json': { schema } } },
});
const carrierPath = { path: z.object({ carrier: CarrierCodeSchema }) };

export const carriersOpenApiPaths: ZodOpenApiPathsObject = {
  '/carriers': {
    get: {
      summary: 'Carriers TrackEcom can connect to',
      responses: json('Carriers', AvailableCarriersResponseSchema),
    },
  },
  '/carriers/accounts': {
    get: {
      summary: 'Carriers this store connected (no credentials)',
      responses: json('Accounts', CarrierAccountsResponseSchema),
    },
  },
  '/carriers/accounts/{carrier}': {
    put: {
      summary: 'Connect or update a carrier account; credentials are checked, then encrypted',
      requestParams: carrierPath,
      requestBody: { content: { 'application/json': { schema: ConnectCarrierRequestSchema } } },
      responses: json('Connected account', CarrierAccountSchema),
    },
    delete: {
      summary: 'Disconnect a carrier and delete its credentials',
      requestParams: carrierPath,
      responses: { '204': { description: 'Deleted' } },
    },
  },
};
