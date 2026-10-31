import {
  AgentStatsQuerySchema,
  AgentStatsResponseSchema,
  CallScriptSchema,
  CallScriptsResponseSchema,
  ConfirmationSettingsSchema,
  LogCallRequestSchema,
  LogCallResponseSchema,
  NextCallQuerySchema,
  NextCallResponseSchema,
  ReleaseLockResponseSchema,
  ScriptLanguageSchema,
  UpdateCallScriptRequestSchema,
} from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { z } from 'zod';

const json = (description: string, schema: z.ZodType, status = '200') => ({
  [status]: { description, content: { 'application/json': { schema } } },
});
const body = (schema: z.ZodType) => ({ content: { 'application/json': { schema } } });

export const confirmationOpenApiPaths: ZodOpenApiPathsObject = {
  '/confirmation/next': {
    get: {
      summary: 'Take the next order to call (locked to you for 5 minutes)',
      requestParams: { query: NextCallQuerySchema },
      responses: json('Next order, or item null when the queue is empty', NextCallResponseSchema),
    },
  },
  '/confirmation/orders/{id}/release': {
    post: {
      summary: 'Give an order back to the queue without logging a call',
      requestParams: { path: z.object({ id: z.uuid() }) },
      responses: json('Whether you held it', ReleaseLockResponseSchema),
    },
  },
  '/confirmation/calls': {
    post: {
      summary: 'Log the outcome of a call on an order you hold',
      requestBody: body(LogCallRequestSchema),
      responses: json('The attempt and the new order status', LogCallResponseSchema, '201'),
    },
  },
  '/confirmation/settings': {
    get: {
      summary: 'Queue rules of the store',
      responses: json('Settings', ConfirmationSettingsSchema),
    },
    put: {
      summary: 'Replace the queue rules',
      requestBody: body(ConfirmationSettingsSchema),
      responses: json('Saved settings', ConfirmationSettingsSchema),
    },
  },
  '/confirmation/scripts': {
    get: {
      summary: 'Call scripts of the store',
      responses: json('Scripts', CallScriptsResponseSchema),
    },
  },
  '/confirmation/scripts/{language}': {
    put: {
      summary: 'Save the call script for one language',
      requestParams: { path: z.object({ language: ScriptLanguageSchema }) },
      requestBody: body(UpdateCallScriptRequestSchema),
      responses: json('Saved script', CallScriptSchema),
    },
  },
  '/confirmation/stats': {
    get: {
      summary: 'Calls, calls per hour, confirm rate and handle time per agent',
      requestParams: { query: AgentStatsQuerySchema },
      responses: json('Per-agent numbers, busiest first', AgentStatsResponseSchema),
    },
  },
};
