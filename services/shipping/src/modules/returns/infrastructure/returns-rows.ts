import type {
  ExpectedReturn,
  ParcelStatus,
  ReturnBatch,
  ReturnCondition,
} from '@trackecom/contracts';
import type { Prisma } from '../../../generated/prisma/client.js';
import { RETURN_STATUSES, daysWaiting } from '../domain/return-window.js';

/** The first carrier scan that announced the return. */
export const FIRST_RETURN_SCAN = {
  events: {
    where: { status: { in: [...RETURN_STATUSES] } },
    orderBy: { at: 'asc' },
    take: 1,
    select: { at: true },
  },
} satisfies Prisma.ShipmentInclude;

type ShipmentWithScan = Prisma.ShipmentGetPayload<{ include: typeof FIRST_RETURN_SCAN }>;

export function toExpected(row: ShipmentWithScan, now: Date, overdueDays: number): ExpectedReturn {
  const since = row.events[0]?.at ?? row.lastEventAt ?? row.updatedAt;
  const waiting = daysWaiting(since, now);
  return {
    shipmentId: row.id,
    orderId: row.orderId,
    carrier: row.carrier,
    trackingNumber: row.trackingNumber,
    wilayaCode: row.toWilayaCode,
    status: row.status as ParcelStatus,
    returnSince: since.toISOString(),
    daysWaiting: waiting,
    overdue: waiting >= overdueDays,
  };
}

export const BATCH_RECEIPTS = {
  receipts: {
    include: { shipment: { select: { orderId: true, trackingNumber: true } } },
    orderBy: { receivedAt: 'asc' },
  },
} satisfies Prisma.ReturnBatchInclude;

type BatchRow = Prisma.ReturnBatchGetPayload<object>;
type BatchWithReceipts = Prisma.ReturnBatchGetPayload<{ include: typeof BATCH_RECEIPTS }>;

export function toBatchHeader(row: BatchRow) {
  return {
    id: row.id,
    carrier: row.carrier,
    courierName: row.courierName,
    note: row.note,
    receivedBy: row.receivedBy,
    createdAt: row.createdAt.toISOString(),
    missing: row.missing,
    unknown: row.unknown,
    alreadyReceived: row.alreadyReceived,
  };
}

export function toBatch(row: BatchWithReceipts): ReturnBatch {
  const received = row.receipts.map((receipt) => ({
    shipmentId: receipt.shipmentId,
    orderId: receipt.shipment.orderId,
    trackingNumber: receipt.shipment.trackingNumber,
    condition: receipt.condition as ReturnCondition,
    unannounced: receipt.unannounced,
  }));
  return { ...toBatchHeader(row), received };
}
