import {
  type Claim,
  type ClaimCandidate,
  type ClaimReason,
  ClaimReasonSchema,
  ClaimStateSchema,
  ParcelStatusSchema,
} from '@trackecom/contracts';
import type { Prisma } from '../../../generated/prisma/client.js';
import type { ClaimedParcel } from '../application/claims.ports.js';

export const WITH_SHIPMENT = {
  shipment: { select: { orderId: true, carrier: true, trackingNumber: true } },
} as const;
type ClaimRow = Prisma.ClaimGetPayload<{ include: typeof WITH_SHIPMENT }>;

export const toClaim = (row: ClaimRow): Claim => ({
  id: row.id,
  shipmentId: row.shipmentId,
  orderId: row.shipment.orderId,
  carrier: row.shipment.carrier,
  trackingNumber: row.shipment.trackingNumber,
  reason: ClaimReasonSchema.parse(row.reason),
  state: ClaimStateSchema.parse(row.state),
  declaredValue: row.declaredValue,
  recovered: row.recovered,
  note: row.note,
  createdAt: row.createdAt.toISOString(),
  submittedAt: row.submittedAt?.toISOString() ?? null,
  closedAt: row.closedAt?.toISOString() ?? null,
});

export const PARCEL_FIELDS = {
  id: true,
  status: true,
  carrier: true,
  trackingNumber: true,
  reference: true,
  createdAt: true,
} as const;
type ParcelRow = Prisma.ShipmentGetPayload<{ select: typeof PARCEL_FIELDS }>;

export const toParcel = (row: ParcelRow): ClaimedParcel => ({
  ...row,
  status: ParcelStatusSchema.parse(row.status),
});

export const CANDIDATE_FIELDS = {
  id: true,
  orderId: true,
  carrier: true,
  trackingNumber: true,
  status: true,
  lastEventAt: true,
  createdAt: true,
  returnReceipt: { select: { receivedAt: true } },
} as const;
type CandidateRow = Prisma.ShipmentGetPayload<{ select: typeof CANDIDATE_FIELDS }>;

export const toCandidate =
  (reason: ClaimReason) =>
  (row: CandidateRow): ClaimCandidate => ({
    shipmentId: row.id,
    orderId: row.orderId,
    carrier: row.carrier,
    trackingNumber: row.trackingNumber,
    reason,
    status: row.status,
    since: (row.returnReceipt?.receivedAt ?? row.lastEventAt ?? row.createdAt).toISOString(),
  });
