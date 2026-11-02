import type { NotificationMessage } from '@trackecom/contracts';
import type { MessageRecord } from '../application/ports/stores.js';

export const toMessageDto = (message: MessageRecord): NotificationMessage => ({
  id: message.id,
  orderId: message.orderId,
  trigger: message.trigger,
  channel: message.channel,
  status: message.status,
  skipReason: message.skipReason,
  costDzd: message.costCentimes === null ? null : message.costCentimes / 100,
  queuedAt: message.queuedAt.toISOString(),
  sentAt: message.sentAt?.toISOString() ?? null,
  deliveredAt: message.deliveredAt?.toISOString() ?? null,
});
