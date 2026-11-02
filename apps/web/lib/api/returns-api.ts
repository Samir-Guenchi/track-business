import {
  AvailableCarriersResponseSchema,
  type CreateReturnBatchInput,
  ListExpectedReturnsResponseSchema,
  ListReturnBatchesResponseSchema,
  ReturnBatchSchema,
  ReturnSummaryResponseSchema,
} from '@trackecom/contracts';
import { apiRequest } from './api-client';

/** Return-to-seller chain (#133), served by the shipping service. */
export const returnsApi = {
  expected: (query: URLSearchParams) =>
    apiRequest({
      path: `/returns/expected?${query.toString()}`,
      schema: ListExpectedReturnsResponseSchema,
    }),
  summary: () => apiRequest({ path: '/returns/summary', schema: ReturnSummaryResponseSchema }),
  batches: (query: URLSearchParams) =>
    apiRequest({
      path: `/returns/batches?${query.toString()}`,
      schema: ListReturnBatchesResponseSchema,
    }),
  batch: (id: string) =>
    apiRequest({ path: `/returns/batches/${encodeURIComponent(id)}`, schema: ReturnBatchSchema }),
  receive: (body: CreateReturnBatchInput) =>
    apiRequest({ path: '/returns/batches', schema: ReturnBatchSchema, method: 'POST', body }),
  carriers: () => apiRequest({ path: '/carriers', schema: AvailableCarriersResponseSchema }),
};
