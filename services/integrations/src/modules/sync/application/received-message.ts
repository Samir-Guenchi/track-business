import { randomUUID } from 'node:crypto';
import { INTEGRATION_EVENTS, type OrderReceivedEventInput } from '@trackecom/contracts';
import { type OutboxMessage, outboxMessage } from '../../../shared/outbox-message.js';
import type { ConnectionRecord } from '../../connections/application/ports/connection.repository.js';

/** The outbox row announcing one shop order to orders. */
export function receivedMessage(
  connection: ConnectionRecord,
  data: OrderReceivedEventInput,
): OutboxMessage {
  const origin = { storeId: connection.storeId, correlationId: randomUUID(), now: new Date() };
  return outboxMessage(origin, INTEGRATION_EVENTS.orderReceived, data);
}
