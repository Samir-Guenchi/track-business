import { randomUUID } from 'node:crypto';
import { type EventEnvelope, SHIPMENT_EVENTS, TRACKING_EVENTS } from '@trackecom/contracts';

/** Shipping's events as the payments consumer reads them, for one store. */
export function parcelEvents(storeId: string) {
  const envelope = (type: string, data: Record<string, unknown>): EventEnvelope => ({
    id: randomUUID(),
    type,
    occurredAt: new Date().toISOString(),
    storeId,
    correlationId: randomUUID(),
    data,
  });
  const created = (trackingNumber: string, codAmount: number) =>
    envelope(SHIPMENT_EVENTS.created, {
      shipmentId: randomUUID(),
      orderId: randomUUID(),
      reference: `ref-${trackingNumber}`,
      carrier: 'yalidine',
      trackingNumber,
      publicCode: 'pUbLiCcOdE_0123456789',
      labelUrl: null,
      codAmount,
    });
  const moved = (trackingNumber: string, to: 'delivered' | 'returned' | 'in_transit') =>
    envelope(TRACKING_EVENTS.statusChanged, {
      shipmentId: randomUUID(),
      orderId: randomUUID(),
      carrier: 'yalidine',
      trackingNumber,
      from: 'out_for_delivery',
      to,
      failureReason: null,
      at: '2026-11-03T10:00:00.000Z',
    });
  return { created, moved };
}
