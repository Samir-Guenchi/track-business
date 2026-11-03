import {
  AddLiveCommentsResponseSchema,
  AddLiveCommentsSchema,
  CreateLiveSessionSchema,
  LinkLiveOrderSchema,
  ListLiveSessionsResponseSchema,
  LiveSessionSchema,
} from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { z } from 'zod';

const json = (schema: z.ZodType) => ({ content: { 'application/json': { schema } } });
const ok = (description: string, schema: z.ZodType) => ({
  '200': { description, ...json(schema) },
});
const sessionId = { path: z.object({ id: z.uuid() }) };

export const liveSellingOpenApiPaths: ZodOpenApiPathsObject = {
  '/live-sessions': {
    post: {
      summary: 'Start a live selling session with its product codes (#199)',
      requestBody: json(CreateLiveSessionSchema),
      responses: { '201': { description: 'The session', ...json(LiveSessionSchema) } },
    },
    get: {
      summary: 'Live sessions, newest first',
      responses: ok('Sessions with reservation counts', ListLiveSessionsResponseSchema),
    },
  },
  '/live-sessions/{id}': {
    get: {
      summary: 'A session with its products and reservations',
      requestParams: sessionId,
      responses: ok('The session', LiveSessionSchema),
    },
  },
  '/live-sessions/{id}/comments': {
    post: {
      summary: 'Read pasted comments into reservations, one per phone and code',
      requestParams: sessionId,
      requestBody: json(AddLiveCommentsSchema),
      responses: ok('What was added and the session', AddLiveCommentsResponseSchema),
    },
  },
  '/live-sessions/{id}/reservations/{reservationId}': {
    patch: {
      summary: 'Link the order created from a reservation',
      requestParams: { path: z.object({ id: z.uuid(), reservationId: z.uuid() }) },
      requestBody: json(LinkLiveOrderSchema),
      responses: ok('The session', LiveSessionSchema),
    },
  },
};
