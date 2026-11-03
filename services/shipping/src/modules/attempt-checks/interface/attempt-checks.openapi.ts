import {
  AnswerAttemptCheckSchema,
  AttemptChecksQuerySchema,
  AttemptChecksReportSchema,
  PublicAttemptCheckSchema,
} from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { z } from 'zod';

const ok = (description: string, schema: z.ZodType) => ({
  '200': { description, content: { 'application/json': { schema } } },
});
const publicCode = { path: z.object({ publicCode: z.string() }) };

export const attemptChecksOpenApiPaths: ZodOpenApiPathsObject = {
  '/public/tracking/{publicCode}/attempt-check': {
    get: {
      summary: 'The failed attempt the customer can confirm or deny (#195)',
      requestParams: publicCode,
      responses: ok('The open question, or null', PublicAttemptCheckSchema),
    },
    post: {
      summary: 'Answer whether the courier really called or came',
      requestParams: publicCode,
      requestBody: { content: { 'application/json': { schema: AnswerAttemptCheckSchema } } },
      responses: ok('The question with its answer', PublicAttemptCheckSchema),
    },
  },
  '/attempt-checks': {
    get: {
      summary: 'Disputed failed attempts per carrier',
      requestParams: { query: AttemptChecksQuerySchema },
      responses: ok('Counts per carrier and the disputed parcels', AttemptChecksReportSchema),
    },
  },
};
