import {
  ListParcelMoneyQuerySchema,
  ListParcelMoneyResponseSchema,
  MoneySettingsSchema,
  MoneySummarySchema,
} from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { payoutsOpenApiPaths } from './payouts.openapi.js';

const settings = {
  description: 'Settings',
  content: { 'application/json': { schema: MoneySettingsSchema } },
};

export const moneyOpenApiPaths: ZodOpenApiPathsObject = {
  '/money/summary': {
    get: {
      summary: "The store's COD ledger: expected, received, fees, outstanding, flagged parcels",
      responses: {
        '200': {
          description: 'Summary',
          content: { 'application/json': { schema: MoneySummarySchema } },
        },
      },
    },
  },
  '/money/parcels': {
    get: {
      summary: "Where each parcel's money stands; filter by status for the claim list",
      requestParams: { query: ListParcelMoneyQuerySchema },
      responses: {
        '200': {
          description: 'Page of parcels',
          content: { 'application/json': { schema: ListParcelMoneyResponseSchema } },
        },
      },
    },
  },
  '/money/settings': {
    get: { summary: 'When an unpaid parcel becomes missing', responses: { '200': settings } },
    put: {
      summary: 'Change when an unpaid parcel becomes missing (money.manage)',
      requestBody: { content: { 'application/json': { schema: MoneySettingsSchema } } },
      responses: { '200': settings },
    },
  },
  ...payoutsOpenApiPaths,
};
