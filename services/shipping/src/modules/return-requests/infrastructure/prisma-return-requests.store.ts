import { Injectable } from '@nestjs/common';
import type { ListReturnRequestsQuery, SellerReturnRequest } from '@trackecom/contracts';
import { Prisma } from '../../../generated/prisma/client.js';
import { writeOutbox } from '../../../infrastructure/outbox/write-outbox.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { OutboxMessage } from '../../../shared/outbox-message.js';
import type {
  RequestParcel,
  ReturnRequestRecord,
  ReturnRequestsStore,
} from '../application/return-requests.ports.js';
import { type ReturnRequestRow, toRecord, toSellerView } from './return-request-rows.js';

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

@Injectable()
export class PrismaReturnRequestsStore implements ReturnRequestsStore {
  constructor(private readonly prisma: PrismaService) {}

  async parcelByCode(publicCode: string): Promise<RequestParcel | null> {
    const row = await this.prisma.shipment.findUnique({
      where: { publicCode },
      select: {
        id: true,
        storeId: true,
        orderId: true,
        events: {
          where: { status: { not: null } },
          orderBy: { at: 'desc' },
          take: 1,
          select: { status: true, at: true },
        },
      },
    });
    if (!row) return null;
    const { events, ...parcel } = row;
    return { ...parcel, last: events[0] ?? null };
  }

  async requestFor(shipmentId: string): Promise<ReturnRequestRecord | null> {
    const row = await this.prisma.returnRequest.findUnique({ where: { shipmentId } });
    return row ? toRecord(row) : null;
  }

  async trackingCodeOf(storeId: string, orderId: string): Promise<string | null> {
    const row = await this.prisma.shipment.findFirst({
      where: { storeId, orderId },
      orderBy: { createdAt: 'desc' },
      select: { publicCode: true },
    });
    return row?.publicCode ?? null;
  }

  async create(record: ReturnRequestRecord, outbox: readonly OutboxMessage[]): Promise<boolean> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.returnRequest.create({ data: record });
        await writeOutbox(tx, outbox);
      });
      return true;
    } catch (error) {
      if (isUniqueViolation(error)) return false;
      throw error;
    }
  }

  async list(storeId: string, query: ListReturnRequestsQuery): Promise<SellerReturnRequest[]> {
    const rows = await this.prisma.returnRequest.findMany({
      where: { storeId, ...(query.state ? { state: query.state } : {}) },
      orderBy: { createdAt: 'desc' },
      take: query.limit,
    });
    return this.withParcels(storeId, rows);
  }

  async byId(storeId: string, id: string): Promise<ReturnRequestRecord | null> {
    const row = await this.prisma.returnRequest.findFirst({ where: { id, storeId } });
    return row ? toRecord(row) : null;
  }

  async sellerView(storeId: string, id: string): Promise<SellerReturnRequest | null> {
    const row = await this.prisma.returnRequest.findFirst({ where: { id, storeId } });
    if (!row) return null;
    const [view] = await this.withParcels(storeId, [row]);
    return view ?? null;
  }

  async decide(record: ReturnRequestRecord, outbox: readonly OutboxMessage[]): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.returnRequest.updateMany({
        where: { id: record.id, storeId: record.storeId, state: 'pending' },
        data: {
          state: record.state,
          sellerMessage: record.sellerMessage,
          newOrderId: record.newOrderId,
          decidedAt: record.decidedAt,
        },
      });
      if (count === 0) return false;
      await writeOutbox(tx, outbox);
      return true;
    });
  }

  private async withParcels(storeId: string, rows: readonly ReturnRequestRow[]) {
    const shipments = await this.prisma.shipment.findMany({
      where: { storeId, id: { in: rows.map((row) => row.shipmentId) } },
      select: { id: true, carrier: true, trackingNumber: true },
    });
    const byId = new Map(shipments.map((shipment) => [shipment.id, shipment]));
    return rows.flatMap((row) => {
      const parcel = byId.get(row.shipmentId);
      return parcel ? [toSellerView(row, parcel)] : [];
    });
  }
}
