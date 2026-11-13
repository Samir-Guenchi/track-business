import {
  ChannelSchema,
  MessageLanguageSchema,
  MessageStatusSchema,
  NotificationTriggerSchema,
  SkipReasonSchema,
} from '@trackecom/contracts';
import type { Message } from '../../../generated/prisma/client.js';
import type { MessageRecord } from '../application/ports/stores.js';

export const toMessageRecord = (row: Message): MessageRecord => ({
  id: row.id,
  storeId: row.storeId,
  orderId: row.orderId,
  trigger: NotificationTriggerSchema.parse(row.trigger),
  channel: ChannelSchema.parse(row.channel),
  language: MessageLanguageSchema.parse(row.language),
  status: MessageStatusSchema.parse(row.status),
  skipReason: row.skipReason === null ? null : SkipReasonSchema.parse(row.skipReason),
  shipmentId: row.shipmentId,
  costCentimes: row.costCentimes,
  queuedAt: row.queuedAt,
  sentAt: row.sentAt,
  deliveredAt: row.deliveredAt,
});
