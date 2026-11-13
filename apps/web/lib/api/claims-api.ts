import {
  type ClaimLetterQuery,
  ClaimLetterSchema,
  ClaimSchema,
  type ClaimState,
  type CreateClaimRequest,
  ListClaimCandidatesResponseSchema,
  ListClaimsResponseSchema,
  ScorecardResponseSchema,
  type UpdateClaimRequest,
} from '@trackecom/contracts';
import { apiRequest } from './api-client';

/** Claims against carriers and the carrier scorecard (#139), served by the shipping service. */
export const claimsApi = {
  candidates: () =>
    apiRequest({ path: '/claims/candidates', schema: ListClaimCandidatesResponseSchema }),
  list: (state?: ClaimState) =>
    apiRequest({
      path: `/claims?limit=100${state ? `&state=${state}` : ''}`,
      schema: ListClaimsResponseSchema,
    }),
  open: (body: CreateClaimRequest) =>
    apiRequest({ path: '/claims', schema: ClaimSchema, method: 'POST', body }),
  update: (id: string, body: UpdateClaimRequest) =>
    apiRequest({
      path: `/claims/${encodeURIComponent(id)}`,
      schema: ClaimSchema,
      method: 'PATCH',
      body,
    }),
  letter: (id: string, { lang }: ClaimLetterQuery) =>
    apiRequest({
      path: `/claims/${encodeURIComponent(id)}/letter?lang=${lang}`,
      schema: ClaimLetterSchema,
    }),
  scorecard: (days: number) =>
    apiRequest({ path: `/carrier-scorecard?days=${days}`, schema: ScorecardResponseSchema }),
};
