import { Injectable } from '@nestjs/common';
import type { ReconciliationStatus } from '@trackecom/contracts';
import { Prisma } from '../../../generated/prisma/client.js';
import { writeOutbox } from '../../../infrastructure/outbox/write-outbox.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type {
  MoneyRepository,
  ParcelChange,
  ParcelKey,
  ParcelRecord,
} from '../application/ports/money.repository.js';
import type { Account } from '../domain/ledger.js';
import { writeEntries, writeParcel } from './parcel-writes.js';

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

export const toParcelRecord = (row: {
  id: string;
  storeId: string;
  carrier: string;
  trackingNumber: string;
  orderId: string | null;
  expectedCod: number | null;
  status: string;
  deliveredAt: Date | null;
  receivedCod: number | null;
  fees: number;
  payoutId: string | null;
}): ParcelRecord => ({ ...row, status: row.status as ReconciliationStatus });

@Injectable()
export class PrismaMoneyRepository implements MoneyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findParcel(key: ParcelKey): Promise<ParcelRecord | null> {
    const row = await this.prisma.parcel.findUnique({
      where: { storeId_carrier_trackingNumber: key },
    });
    return row ? toParcelRecord(row) : null;
  }

  async saveParcel(change: ParcelChange): Promise<boolean> {
    const { parcel } = change;
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.processedEvent.create({ data: change.consumed });
        await writeParcel(tx, parcel, change.previousStatus);
        const owner = { storeId: parcel.storeId, parcelId: parcel.id };
        await writeEntries(tx, [{ owner, postings: change.postings }]);
        await writeOutbox(tx, change.outbox);
      });
      return true;
    } catch (error) {
      if (isUniqueViolation(error)) return false;
      throw error;
    }
  }

  async balances(storeId: string): Promise<Partial<Record<Account, number>>> {
    const rows = await this.prisma.ledgerEntry.groupBy({
      by: ['account'],
      where: { storeId },
      _sum: { amount: true },
    });
    return Object.fromEntries(rows.map((row) => [row.account, row._sum.amount ?? 0]));
  }

  countParcels(storeId: string, statuses: readonly ReconciliationStatus[]): Promise<number> {
    return this.prisma.parcel.count({ where: { storeId, status: { in: [...statuses] } } });
  }
}
