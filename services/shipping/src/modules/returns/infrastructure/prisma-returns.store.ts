import { Injectable } from '@nestjs/common';
import type { ExpectedReturn, ListReturnBatchesQuery, ReturnBatch } from '@trackecom/contracts';
import { Prisma } from '../../../generated/prisma/client.js';
import { writeOutbox } from '../../../infrastructure/outbox/write-outbox.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { decodeKeyset, encodeKeyset } from '../../../shared/keyset-cursor.js';
import type { OutboxMessage } from '../../../shared/outbox-message.js';
import type {
  CarrierReturnCount,
  ExpectedQuery,
  NewBatch,
  Page,
  ReturnsStore,
} from '../application/returns.ports.js';
import type { KnownParcel } from '../domain/return-batch.js';
import { ReturnScanConflictError } from '../domain/return.errors.js';
import { pageOf } from './page.js';
import {
  announcedBefore,
  descendingAfter,
  expectedWhere,
  outstandingReturns,
} from './returns-queries.js';
import {
  BATCH_RECEIPTS,
  FIRST_RETURN_SCAN,
  toBatch,
  toBatchHeader,
  toExpected,
} from './returns-rows.js';

const OLDEST_FIRST = [{ createdAt: 'asc' as const }, { id: 'asc' as const }];
const NEWEST_FIRST = [{ createdAt: 'desc' as const }, { id: 'desc' as const }];

@Injectable()
export class PrismaReturnsStore implements ReturnsStore {
  constructor(private readonly prisma: PrismaService) {}

  async expected({ storeId, query, now }: ExpectedQuery): Promise<Page<ExpectedReturn>> {
    const rows = await this.prisma.shipment.findMany({
      where: expectedWhere(storeId, query, now),
      include: FIRST_RETURN_SCAN,
      orderBy: OLDEST_FIRST,
      take: query.limit + 1,
    });
    const page = pageOf(rows, query.limit, encodeKeyset);
    return { ...page, items: page.items.map((row) => toExpected(row, now, query.overdueDays)) };
  }

  async countByCarrier(storeId: string, cutoff: Date): Promise<CarrierReturnCount[]> {
    const count = (where: Prisma.ShipmentWhereInput) =>
      this.prisma.shipment.groupBy({ by: ['carrier'], where, _count: { _all: true } });
    const [all, late] = await Promise.all([
      count(outstandingReturns(storeId)),
      count({ AND: [outstandingReturns(storeId), announcedBefore(cutoff)] }),
    ]);
    const overdue = new Map(late.map((row) => [row.carrier, row._count._all]));
    return all.map((row) => ({
      carrier: row.carrier,
      expected: row._count._all,
      overdue: overdue.get(row.carrier) ?? 0,
    }));
  }

  async findParcels(storeId: string, carrier: string, numbers: readonly string[]) {
    const rows = await this.prisma.shipment.findMany({
      where: { storeId, carrier, trackingNumber: { in: [...numbers] } },
      include: { returnReceipt: { select: { shipmentId: true } } },
    });
    const parcels = rows.map((row): KnownParcel => ({
      shipmentId: row.id,
      orderId: row.orderId,
      trackingNumber: row.trackingNumber,
      status: row.status,
      alreadyReceived: row.returnReceipt !== null,
    }));
    return new Map(parcels.map((parcel) => [parcel.trackingNumber, parcel]));
  }

  async saveBatch(batch: NewBatch, outbox: readonly OutboxMessage[]): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.returnBatch.create({ data: batchRow(batch) });
        await tx.returnReceipt.createMany({ data: receiptRows(batch) });
        await writeOutbox(tx, outbox);
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new ReturnScanConflictError('Parcel already received');
      throw error;
    }
  }

  async batch(storeId: string, id: string): Promise<ReturnBatch | null> {
    const row = await this.prisma.returnBatch.findFirst({
      where: { id, storeId },
      include: BATCH_RECEIPTS,
    });
    return row ? toBatch(row) : null;
  }

  async batches(storeId: string, query: ListReturnBatchesQuery) {
    const rows = await this.prisma.returnBatch.findMany({
      where: {
        storeId,
        ...(query.carrier ? { carrier: query.carrier } : {}),
        ...descendingAfter(decodeKeyset(query.cursor)),
      },
      orderBy: NEWEST_FIRST,
      take: query.limit + 1,
    });
    const page = pageOf(rows, query.limit, encodeKeyset);
    const items = page.items.map((row) => ({
      ...toBatchHeader(row),
      receivedCount: row.receivedCount,
    }));
    return { ...page, items };
  }
}

const batchRow = (batch: NewBatch) => ({
  id: batch.id,
  storeId: batch.storeId,
  carrier: batch.carrier,
  courierName: batch.courierName,
  note: batch.note,
  receivedBy: batch.receivedBy,
  missing: [...batch.missing],
  unknown: [...batch.unknown],
  alreadyReceived: [...batch.alreadyReceived],
  receivedCount: batch.receipts.length,
  createdAt: batch.createdAt,
});

const receiptRows = (batch: NewBatch) =>
  batch.receipts.map((receipt) => ({
    shipmentId: receipt.shipmentId,
    storeId: batch.storeId,
    batchId: batch.id,
    condition: receipt.condition,
    unannounced: receipt.unannounced,
    receivedAt: batch.createdAt,
  }));

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
