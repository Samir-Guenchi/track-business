import { z } from 'zod';
import { CursorQuerySchema, cursorPage } from '../common/pagination.schema.js';
import { AlgerianPhoneSchema } from '../common/phone.schema.js';
import { ChannelSchema, NotificationTriggerSchema } from './notification-settings.schema.js';
export const MESSAGE_STATUSES = ['queued', 'sent', 'delivered', 'failed', 'skipped'];
export const MessageStatusSchema = z.enum(MESSAGE_STATUSES);
export const SKIP_REASONS = ['opted_out', 'disabled', 'no_contact'];
export const SkipReasonSchema = z.enum(SKIP_REASONS);
/** One message to a customer. No phone and no text: those stay with the provider call. */
export const NotificationMessageSchema = z.strictObject({
  id: z.uuid(),
  orderId: z.uuid(),
  trigger: NotificationTriggerSchema,
  channel: ChannelSchema,
  status: MessageStatusSchema,
  skipReason: SkipReasonSchema.nullable(),
  /** What the provider charged, in DZD; null until sent. */
  costDzd: z.number().nonnegative().nullable(),
  queuedAt: z.iso.datetime(),
  sentAt: z.iso.datetime().nullable(),
  deliveredAt: z.iso.datetime().nullable(),
});
export const ListMessagesQuerySchema = CursorQuerySchema.extend({
  cursor: z.uuid().optional(),
  orderId: z.uuid().optional(),
  status: MessageStatusSchema.optional(),
});
export const ListMessagesResponseSchema = cursorPage(NotificationMessageSchema);
/** `GET /notifications/usage?month=2026-11`: what the store spent on messages that month. */
export const UsageQuerySchema = z.strictObject({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
});
export const UsageResponseSchema = z.strictObject({
  month: z.string(),
  sent: z.number().int().nonnegative(),
  delivered: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  costDzd: z.number().nonnegative(),
});
/** `POST /notifications/opt-outs`: the customer asked to receive nothing more from the store. */
export const OptOutRequestSchema = z.strictObject({ phone: AlgerianPhoneSchema });
