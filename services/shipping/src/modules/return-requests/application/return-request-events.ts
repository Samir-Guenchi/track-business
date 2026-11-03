import { randomUUID } from 'node:crypto';
import { type ReturnRequestEvent } from '@trackecom/contracts';
import { outboxMessage } from '../../../shared/outbox-message.js';
import type { ReturnRequestRecord } from './return-requests.ports.js';

/** The event for a request just created or decided, for orders and notifications. */
export function requestMessage(type: string, record: ReturnRequestRecord, now: Date) {
  const data: ReturnRequestEvent = {
    requestId: record.id,
    shipmentId: record.shipmentId,
    orderId: record.orderId,
    kind: record.kind,
    state: record.state,
    newOrderId: record.newOrderId,
  };
  return outboxMessage({ storeId: record.storeId, correlationId: randomUUID(), now }, type, data);
}
