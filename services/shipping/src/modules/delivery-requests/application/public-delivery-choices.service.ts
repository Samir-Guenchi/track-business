import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  type CreateDeliveryRequest,
  DELIVERY_REQUEST_EVENTS,
  DELIVERY_REQUEST_LIMITS,
  type DeliveryChoices,
  type DeliveryRequestCreatedEvent,
} from '@trackecom/contracts';
import { outboxMessage } from '../../../shared/outbox-message.js';
import { TrackingNotFoundError } from '../../tracking/domain/tracking.errors.js';
import {
  availableKinds,
  dateWindow,
  type ParcelFacts,
  refusalOf,
} from '../domain/delivery-choices.js';
import { errorFor } from '../domain/delivery-request.errors.js';
import {
  type Clock,
  DELIVERY_FEES,
  DELIVERY_REQUESTS_CLOCK,
  DELIVERY_REQUESTS_STORE,
  type DeliveryFees,
  type DeliveryRequestsStore,
  type TrackedParcel,
} from './delivery-requests.ports.js';

const DAY_MS = 86_400_000;

/** The customer's side of #136: the public tracking code is the only key, as for tracking. */
@Injectable()
export class PublicDeliveryChoicesService {
  constructor(
    @Inject(DELIVERY_REQUESTS_STORE) private readonly store: DeliveryRequestsStore,
    @Inject(DELIVERY_FEES) private readonly fees: DeliveryFees,
    @Inject(DELIVERY_REQUESTS_CLOCK) private readonly now: Clock,
  ) {}

  async choices(publicCode: string): Promise<DeliveryChoices> {
    const parcel = await this.parcel(publicCode);
    const now = this.now();
    const [facts, history, stopDeskFeeDelta] = await Promise.all([
      this.facts(parcel),
      this.store.forParcel(parcel.id),
      this.fees.stopDeskDelta(parcel.storeId, parcel.toWilayaCode),
    ]);
    const window = dateWindow(now);
    return {
      kinds: availableKinds(facts),
      stopDeskFeeDelta,
      earliestDate: window.earliest,
      latestDate: window.latest,
      remainingToday: Math.max(0, DELIVERY_REQUEST_LIMITS.perDay - usedSince(history, now)),
      requests: history.map(({ at: _at, ...request }) => request),
    };
  }

  async request(publicCode: string, request: CreateDeliveryRequest): Promise<DeliveryChoices> {
    const parcel = await this.parcel(publicCode);
    const now = this.now();
    const [facts, history] = await Promise.all([
      this.facts(parcel),
      this.store.forParcel(parcel.id),
    ]);
    const refusal = refusalOf(request, { parcel: facts, now, usedToday: usedSince(history, now) });
    if (refusal) throw errorFor(refusal);
    const id = randomUUID();
    const data: DeliveryRequestCreatedEvent = {
      requestId: id,
      shipmentId: parcel.id,
      orderId: parcel.orderId,
      request,
    };
    const origin = { storeId: parcel.storeId, correlationId: randomUUID(), now };
    await this.store.create({ id, parcel, request, createdAt: now }, [
      outboxMessage(origin, DELIVERY_REQUEST_EVENTS.created, data),
    ]);
    return this.choices(publicCode);
  }

  private async parcel(publicCode: string): Promise<TrackedParcel> {
    const parcel = await this.store.parcelByCode(publicCode);
    if (!parcel) throw new TrackingNotFoundError('No parcel for this tracking link');
    return parcel;
  }

  private async facts(parcel: TrackedParcel): Promise<ParcelFacts> {
    const stopDeskNearby = await this.store.stopDeskNearby(parcel.carrier, parcel.toWilayaCode);
    return { status: parcel.status, deliveryType: parcel.deliveryType, stopDeskNearby };
  }
}

const usedSince = (history: readonly { at: Date }[], now: Date) =>
  history.filter((each) => now.getTime() - each.at.getTime() < DAY_MS).length;
