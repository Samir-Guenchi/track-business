import { z } from 'zod';

/** When a customer gets a message (#46). Each maps to an order or parcel event. */
export const NOTIFICATION_TRIGGERS = [
  'order_confirmed',
  'parcel_shipped',
  'out_for_delivery',
  'failed_attempt',
  'parcel_delivered',
  'parcel_returned',
] as const;
export const NotificationTriggerSchema = z.enum(NOTIFICATION_TRIGGERS);
export type NotificationTrigger = z.infer<typeof NotificationTriggerSchema>;

export const CHANNELS = ['sms', 'whatsapp'] as const;
export const ChannelSchema = z.enum(CHANNELS);
export type Channel = z.infer<typeof ChannelSchema>;

/** Customers read Arabic, French or Darija (written in Latin letters). */
export const MessageLanguageSchema = z.enum(['ar', 'fr', 'darija']);
export type MessageLanguage = z.infer<typeof MessageLanguageSchema>;

const Hour = z.number().int().min(0).max(23);

/** `GET/PUT /notifications/settings`: one per store. Off until the store turns it on. */
export const NotificationSettingsSchema = z.strictObject({
  enabled: z.boolean().default(false),
  channel: ChannelSchema.default('sms'),
  language: MessageLanguageSchema.default('ar'),
  triggers: z
    .array(NotificationTriggerSchema)
    .max(NOTIFICATION_TRIGGERS.length)
    .default(['parcel_shipped', 'out_for_delivery', 'failed_attempt']),
  /** No message is sent from `start` to `end` (Algiers time); it waits for `end`. */
  quietHours: z.strictObject({ start: Hour, end: Hour }).default({ start: 21, end: 8 }),
  /** Shown in messages as {store_name}. */
  storeName: z.string().trim().min(1).max(40).nullable().default(null),
});
export type NotificationSettings = z.infer<typeof NotificationSettingsSchema>;
