import {
  ReturnRequestKindSchema,
  ReturnRequestReasonSchema,
  ReturnRequestStateSchema,
  type SellerReturnRequest,
} from '@trackecom/contracts';
import type { Prisma } from '../../../generated/prisma/client.js';
import type { ReturnRequestRecord } from '../application/return-requests.ports.js';

export type ReturnRequestRow = Prisma.ReturnRequestGetPayload<object>;

export interface ParcelRef {
  readonly carrier: string;
  readonly trackingNumber: string;
}

export function toRecord(row: ReturnRequestRow): ReturnRequestRecord {
  return {
    ...row,
    kind: ReturnRequestKindSchema.parse(row.kind),
    reason: ReturnRequestReasonSchema.parse(row.reason),
    state: ReturnRequestStateSchema.parse(row.state),
  };
}

export function toSellerView(row: ReturnRequestRow, parcel: ParcelRef): SellerReturnRequest {
  const record = toRecord(row);
  return {
    id: record.id,
    shipmentId: record.shipmentId,
    orderId: record.orderId,
    carrier: parcel.carrier,
    trackingNumber: parcel.trackingNumber,
    kind: record.kind,
    reason: record.reason,
    wanted: record.wanted,
    note: record.note,
    state: record.state,
    sellerMessage: record.sellerMessage,
    newOrderId: record.newOrderId,
    createdAt: record.createdAt.toISOString(),
    decidedAt: record.decidedAt?.toISOString() ?? null,
  };
}
