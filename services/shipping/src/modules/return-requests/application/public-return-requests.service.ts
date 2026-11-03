import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  type CreateReturnRequest,
  type PublicReturnRequest,
  type PublicReturnStatus,
  RETURN_REQUEST_EVENTS,
} from '@trackecom/contracts';
import { TrackingNotFoundError } from '../../tracking/domain/tracking.errors.js';
import {
  insideWindow,
  returnDeadline,
  ReturnRequestExistsError,
  ReturnWindowClosedError,
} from '../domain/return-request.js';
import { requestMessage } from './return-request-events.js';
import {
  type Clock,
  RETURN_REQUESTS_CLOCK,
  RETURN_REQUESTS_STORE,
  type RequestParcel,
  type ReturnRequestRecord,
  type ReturnRequestsStore,
} from './return-requests.ports.js';

/** "Return or exchange" on the tracking page (#201); the public code is the only key. */
@Injectable()
export class PublicReturnRequestsService {
  constructor(
    @Inject(RETURN_REQUESTS_STORE) private readonly store: ReturnRequestsStore,
    @Inject(RETURN_REQUESTS_CLOCK) private readonly now: Clock,
  ) {}

  async status(publicCode: string): Promise<PublicReturnStatus> {
    const parcel = await this.parcel(publicCode);
    const record = await this.store.requestFor(parcel.id);
    const deadline = returnDeadline(parcel.last);
    return {
      canRequest: !record && insideWindow(parcel.last, this.now()),
      deadline: deadline?.toISOString() ?? null,
      request: record ? await this.publicView(record) : null,
    };
  }

  async create(publicCode: string, body: CreateReturnRequest): Promise<PublicReturnStatus> {
    const parcel = await this.parcel(publicCode);
    const now = this.now();
    if (!insideWindow(parcel.last, now)) {
      throw new ReturnWindowClosedError('Returns are not open for this parcel');
    }
    const record = newRecord(parcel, body, now);
    const message = requestMessage(RETURN_REQUEST_EVENTS.created, record, now);
    if (!(await this.store.create(record, [message]))) {
      throw new ReturnRequestExistsError('A request was already sent for this parcel');
    }
    return this.status(publicCode);
  }

  private async publicView(record: ReturnRequestRecord): Promise<PublicReturnRequest> {
    const newTrackingCode = record.newOrderId
      ? await this.store.trackingCodeOf(record.storeId, record.newOrderId)
      : null;
    return {
      kind: record.kind,
      reason: record.reason,
      wanted: record.wanted,
      note: record.note,
      state: record.state,
      sellerMessage: record.sellerMessage,
      createdAt: record.createdAt.toISOString(),
      decidedAt: record.decidedAt?.toISOString() ?? null,
      newTrackingCode,
    };
  }

  private async parcel(publicCode: string): Promise<RequestParcel> {
    const parcel = await this.store.parcelByCode(publicCode);
    if (!parcel) throw new TrackingNotFoundError('No parcel for this tracking link');
    return parcel;
  }
}

function newRecord(
  parcel: RequestParcel,
  body: CreateReturnRequest,
  now: Date,
): ReturnRequestRecord {
  return {
    id: randomUUID(),
    storeId: parcel.storeId,
    shipmentId: parcel.id,
    orderId: parcel.orderId,
    kind: body.kind,
    reason: body.reason,
    wanted: body.wanted || null,
    note: body.note || null,
    state: 'pending',
    sellerMessage: null,
    newOrderId: null,
    createdAt: now,
    decidedAt: null,
  };
}
