import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  type EventEnvelope,
  ShipmentCreatedEventSchema,
  ShipmentStatusChangedEventSchema,
} from '@trackecom/contracts';
import { applyParcelStatus } from '../domain/parcel-lifecycle.js';
import { MONEY_REPOSITORY, type MoneyRepository } from './ports/money.repository.js';

export const PARCEL_EVENTS_CONSUMER = 'payments.parcels';

const consumed = (event: EventEnvelope) => ({
  consumer: PARCEL_EVENTS_CONSUMER,
  eventId: event.id,
});

/** Learns which parcels owe money, and when, from shipping's events (ADR-0002). */
@Injectable()
export class ParcelEventsUseCase {
  constructor(@Inject(MONEY_REPOSITORY) private readonly money: MoneyRepository) {}

  /** A new parcel: its COD will be owed once delivered. Returns false when nothing changed. */
  async shipmentCreated(event: EventEnvelope): Promise<boolean> {
    const data = ShipmentCreatedEventSchema.parse(event.data);
    const key = {
      storeId: event.storeId,
      carrier: data.carrier,
      trackingNumber: data.trackingNumber,
    };
    if (await this.money.findParcel(key)) return false;
    const parcel = {
      id: randomUUID(),
      ...key,
      orderId: data.orderId,
      expectedCod: data.codAmount,
      status: 'awaiting_delivery' as const,
      deliveredAt: null,
      receivedCod: null,
      fees: 0,
      payoutId: null,
    };
    return this.money.saveParcel({
      parcel,
      previousStatus: null,
      postings: [],
      outbox: [],
      consumed: consumed(event),
    });
  }

  /** Delivered parcels start owing their COD; returned ones owe nothing. */
  async statusChanged(event: EventEnvelope): Promise<boolean> {
    const data = ShipmentStatusChangedEventSchema.parse(event.data);
    const key = {
      storeId: event.storeId,
      carrier: data.carrier,
      trackingNumber: data.trackingNumber,
    };
    const parcel = await this.money.findParcel(key);
    const move = parcel && applyParcelStatus(parcel, data.to, new Date(data.at));
    if (!move) return false;
    return this.money.saveParcel({
      ...move,
      previousStatus: parcel.status,
      outbox: [],
      consumed: consumed(event),
    });
  }
}
