import {
  ClaimLetterQuerySchema,
  ClaimLetterSchema,
  ClaimSchema,
  CreateClaimRequestSchema,
  ListClaimCandidatesQuerySchema,
  ListClaimCandidatesResponseSchema,
  ListClaimsQuerySchema,
  ListClaimsResponseSchema,
  ScorecardQuerySchema,
  ScorecardResponseSchema,
  UpdateClaimRequestSchema,
} from '@trackecom/contracts';
import type { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

const json = (status: string, description: string, schema: z.ZodType) => ({
  [status]: { description, content: { 'application/json': { schema } } },
});
const body = (schema: z.ZodType) => ({ content: { 'application/json': { schema } } });

export const claimsOpenApiPaths: ZodOpenApiPathsObject = {
  '/claims/candidates': {
    get: {
      summary:
        'Parcels that look claimable: stuck, returned but never received, or returned damaged',
      requestParams: { query: ListClaimCandidatesQuerySchema },
      responses: json(
        '200',
        'Claim candidates, longest-waiting first',
        ListClaimCandidatesResponseSchema,
      ),
    },
  },
  '/claims': {
    get: {
      summary: 'Claims, newest first, filtered by state or carrier',
      requestParams: { query: ListClaimsQuerySchema },
      responses: json('200', 'Claims', ListClaimsResponseSchema),
    },
    post: {
      summary: 'Open a claim on a parcel (one per parcel)',
      requestBody: body(CreateClaimRequestSchema),
      responses: json('201', 'The claim', ClaimSchema),
    },
  },
  '/claims/{id}': {
    patch: {
      summary: 'Mark a claim as sent to the carrier, then won (with the amount) or rejected',
      requestBody: body(UpdateClaimRequestSchema),
      responses: json('200', 'The claim', ClaimSchema),
    },
  },
  '/claims/{id}/letter': {
    get: {
      summary: 'The claim letter in French or Arabic, with the tracking timeline',
      requestParams: { query: ClaimLetterQuerySchema },
      responses: json('200', 'Subject and body', ClaimLetterSchema),
    },
  },
  '/carrier-scorecard': {
    get: {
      summary:
        'Delivery rate, days, damaged, lost and claims per carrier, store-wide and per wilaya',
      requestParams: { query: ScorecardQuerySchema },
      responses: json('200', 'Carrier scorecard', ScorecardResponseSchema),
    },
  },
};
