import type {
  ListReturnRequestsQuery,
  ReturnRequestKind,
  ReturnRequestReason,
  ReturnRequestState,
  SellerReturnRequest,
} from '@trackecom/contracts';
import type { OutboxMessage } from '../../../shared/outbox-message.js';
import type { LastStatus } from '../domain/return-request.js';

export const RETURN_REQUESTS_STORE = Symbol('RETURN_REQUESTS_STORE');
export const RETURN_REQUESTS_CLOCK = Symbol('RETURN_REQUESTS_CLOCK');
export type Clock = () => Date;

export interface RequestParcel {
  readonly id: string;
  readonly storeId: string;
  readonly orderId: string;
  readonly last: LastStatus | null;
}

export interface ReturnRequestRecord {
  readonly id: string;
  readonly storeId: string;
  readonly shipmentId: string;
  readonly orderId: string;
  readonly kind: ReturnRequestKind;
  readonly reason: ReturnRequestReason;
  readonly wanted: string | null;
  readonly note: string | null;
  readonly state: ReturnRequestState;
  readonly sellerMessage: string | null;
  readonly newOrderId: string | null;
  readonly createdAt: Date;
  readonly decidedAt: Date | null;
}

export interface ReturnRequestsStore {
  parcelByCode(publicCode: string): Promise<RequestParcel | null>;
  requestFor(shipmentId: string): Promise<ReturnRequestRecord | null>;
  /** The public tracking code of an order's parcel in the same store, once shipped. */
  trackingCodeOf(storeId: string, orderId: string): Promise<string | null>;
  /** false when the parcel already has a request. */
  create(record: ReturnRequestRecord, outbox: readonly OutboxMessage[]): Promise<boolean>;
  list(storeId: string, query: ListReturnRequestsQuery): Promise<SellerReturnRequest[]>;
  byId(storeId: string, id: string): Promise<ReturnRequestRecord | null>;
  sellerView(storeId: string, id: string): Promise<SellerReturnRequest | null>;
  /** false when the request was decided meanwhile (first decision wins). */
  decide(record: ReturnRequestRecord, outbox: readonly OutboxMessage[]): Promise<boolean>;
}
