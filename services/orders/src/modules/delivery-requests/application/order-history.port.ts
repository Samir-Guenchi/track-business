import type { AuditEntry } from '@trackecom/audit';

/**
 * Adds one entry to an order's history for a bus event, together with the processed-event mark,
 * so a redelivered event is refused with EventAlreadyProcessedError.
 */
export interface OrderHistoryWriter {
  append(entry: AuditEntry, consumed: { consumer: string; eventId: string }): Promise<void>;
}

export const ORDER_HISTORY_WRITER = Symbol('OrderHistoryWriter');

/** Consumer group reading the customer's delivery requests from shipping. */
export const DELIVERY_REQUESTS_CONSUMER = 'orders.delivery-requests';
