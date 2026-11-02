import { z } from 'zod';
import {
  ChannelSchema,
  MessageLanguageSchema,
  NotificationTriggerSchema,
} from './notification-settings.schema.js';

/** Placeholders a template may use, written `{name}`. Anything else is refused. */
export const TEMPLATE_VARIABLES = [
  'name',
  'ref',
  'tracking_link',
  'carrier',
  'store_name',
] as const;

const placeholders = (body: string): string[] =>
  [...body.matchAll(/\{([a-z_]+)\}/g)].map((match) => match[1] ?? '');

/** 4 SMS segments in Arabic (UCS-2, 67 characters each) is the most worth paying for. */
export const TemplateBodySchema = z
  .string()
  .trim()
  .min(1)
  .max(268)
  .refine(
    (body) =>
      placeholders(body).every((name) => (TEMPLATE_VARIABLES as readonly string[]).includes(name)),
    { message: `Use only ${TEMPLATE_VARIABLES.map((name) => `{${name}}`).join(', ')}` },
  );

/** `PUT /notifications/templates/:trigger/:channel/:language` */
export const UpdateTemplateRequestSchema = z.strictObject({ body: TemplateBodySchema });
export type UpdateTemplateRequest = z.infer<typeof UpdateTemplateRequestSchema>;

export const NotificationTemplateSchema = z.strictObject({
  trigger: NotificationTriggerSchema,
  channel: ChannelSchema,
  language: MessageLanguageSchema,
  body: z.string(),
  /** False for the built-in text the store has not changed. */
  custom: z.boolean(),
});
export type NotificationTemplate = z.infer<typeof NotificationTemplateSchema>;

export const ListTemplatesResponseSchema = z.strictObject({
  items: z.array(NotificationTemplateSchema),
});
export type ListTemplatesResponse = z.infer<typeof ListTemplatesResponseSchema>;
