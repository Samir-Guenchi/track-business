import type {
  CreateDeliveryRequest,
  DeliveryRequest,
  DeliveryType,
  ListDeliveryRequestsQuery,
  ParcelStatus,
  PublicDeliveryRequest,
} from '@trackecom/contracts';
import type { OutboxMessage } from '../../../shared/outbox-message.js';

export const DELIVERY_REQUESTS_STORE = Symbol('DELIVERY_REQUESTS_STORE');
export const DELIVERY_FEES = Symbol('DELIVERY_FEES');
export const DELIVERY_REQUESTS_CLOCK = Symbol('DELIVERY_REQUESTS_CLOCK');
export type Clock = () => Date;

/** The parcel behind a tracking link, with what the choices depend on. */
export interface TrackedParcel {
  readonly id: string;
  readonly storeId: string;
  readonly orderId: string;
  readonly carrier: string;
  readonly status: ParcelStatus;
  readonly deliveryType: DeliveryType | null;
  readonly toWilayaCode: number | null;
}

export interface NewDeliveryRequest {
  readonly id: string;
  readonly parcel: TrackedParcel;
  readonly request: CreateDeliveryRequest;
  readonly createdAt: Date;
}

export interface StateChange {
  readonly storeId: string;
  readonly id: string;
  readonly state: 'sent' | 'dismissed';
  readonly userId: string;
  readonly at: Date;
}

export interface DeliveryRequestsStore {
  parcelByCode(publicCode: string): Promise<TrackedParcel | null>;
  /** Whether the parcel's carrier has an active stop-desk in the destination wilaya. */
  stopDeskNearby(carrier: string, wilayaCode: number | null): Promise<boolean>;
  /** The parcel's requests, newest first. */
  forParcel(shipmentId: string): Promise<(PublicDeliveryRequest & { at: Date })[]>;
  create(request: NewDeliveryRequest, outbox: readonly OutboxMessage[]): Promise<void>;
  list(storeId: string, query: ListDeliveryRequestsQuery): Promise<DeliveryRequest[]>;
  /** Only a pending request moves; null when none in this store has this id. */
  setState(change: StateChange): Promise<DeliveryRequest | null>;
}

/** Store prices for the destination: what the customer pays more (or less) at a stop-desk. */
export interface DeliveryFees {
  stopDeskDelta(storeId: string, wilayaCode: number | null): Promise<number | null>;
}
