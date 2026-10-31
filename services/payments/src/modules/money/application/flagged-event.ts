import { PAYMENT_EVENTS } from '@trackecom/contracts';
import { type EventOrigin, outboxMessage } from '../../../shared/outbox-message.js';
import type { ParcelRecord } from './ports/money.repository.js';

/** `payments.parcel.flagged.v1`: a parcel the seller should claim from its carrier. */
export const flaggedEvent = (origin: EventOrigin, parcel: ParcelRecord) =>
  outboxMessage(origin, PAYMENT_EVENTS.parcelFlagged, {
    carrier: parcel.carrier,
    trackingNumber: parcel.trackingNumber,
    orderId: parcel.orderId,
    status: parcel.status,
    expectedCod: parcel.expectedCod,
    receivedCod: parcel.receivedCod,
  });
