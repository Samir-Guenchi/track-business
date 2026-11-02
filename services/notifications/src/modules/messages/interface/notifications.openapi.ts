import {
  ListMessagesQuerySchema,
  ListMessagesResponseSchema,
  ListTemplatesResponseSchema,
  NotificationSettingsSchema,
  NotificationTemplateSchema,
  OptOutRequestSchema,
  UpdateTemplateRequestSchema,
  UsageQuerySchema,
  UsageResponseSchema,
} from '@trackecom/contracts';
import type { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

const ok = (description: string, schema: z.ZodType) => ({
  '200': { description, content: { 'application/json': { schema } } },
});
const body = (schema: z.ZodType) => ({ content: { 'application/json': { schema } } });
const done = { '204': { description: 'Done' } };

export const notificationsOpenApiPaths: ZodOpenApiPathsObject = {
  '/notifications/settings': {
    get: {
      summary: "The store's notification settings",
      responses: ok('Settings', NotificationSettingsSchema),
    },
    put: {
      summary: 'Replace the settings (store.update)',
      requestBody: body(NotificationSettingsSchema),
      responses: ok('Settings', NotificationSettingsSchema),
    },
  },
  '/notifications/templates': {
    get: {
      summary: 'Every template, own or built-in',
      responses: ok('Templates', ListTemplatesResponseSchema),
    },
  },
  '/notifications/templates/{trigger}/{channel}/{language}': {
    put: {
      summary: 'Save the store text (store.update)',
      requestBody: body(UpdateTemplateRequestSchema),
      responses: ok('Template', NotificationTemplateSchema),
    },
    delete: { summary: 'Back to the built-in text', responses: done },
  },
  '/notifications/opt-outs': {
    post: {
      summary: 'Stop messages to a phone (orders.confirm)',
      requestBody: body(OptOutRequestSchema),
      responses: done,
    },
  },
  '/notifications/opt-outs/{phone}': {
    delete: { summary: 'Send messages to this phone again (store.update)', responses: done },
  },
  '/notifications/messages': {
    get: {
      summary: 'Messages, newest first (no phone, no text)',
      requestParams: { query: ListMessagesQuerySchema },
      responses: ok('Page', ListMessagesResponseSchema),
    },
  },
  '/notifications/usage': {
    get: {
      summary: 'Messages and cost for a month (money.read)',
      requestParams: { query: UsageQuerySchema },
      responses: ok('Usage', UsageResponseSchema),
    },
  },
};
