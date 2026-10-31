import { randomUUID } from 'node:crypto';
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
import { type Account, type Posting, isBalanced } from '../domain/ledger.js';

type Tx = Prisma.TransactionClient;

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

/** One balanced ledger entry; refuses to write anything that does not sum to zero. */
export async function writePostings(
  tx: Tx,
  owner: { storeId: string; parcelId?: string; payoutId?: string },
  postings: readonly Posting[],
): Promise<void> {
  if (postings.length === 0) return;
  if (!isBalanced(postings)) throw new Error('Unbalanced ledger entry');
  const entryId = randomUUID();
  await tx.ledgerEntry.createMany({
    data: postings.map((posting) => ({ id: randomUUID(), entryId, ...owner, ...posting })),
  });
}

const toRecord = (row: {
  id: string;
  storeId: string;
  carrier: string;
  trackingNumber: string;
  orderId: string | null;
  expectedCod: number | null;
  status: string;
  deliveredAt: Date | null;
}): ParcelRecord => ({ ...row, status: row.status as ReconciliationStatus });

@Injectable()
export class PrismaMoneyRepository implements MoneyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findParcel(key: ParcelKey): Promise<ParcelRecord | null> {
    const row = await this.prisma.parcel.findUnique({
      where: { storeId_carrier_trackingNumber: key },
    });
    return row ? toRecord(row) : null;
  }

  async saveParcel(change: ParcelChange): Promise<boolean> {
    const { parcel } = change;
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.processedEvent.create({ data: change.consumed });
        await tx.parcel.upsert({ where: { id: parcel.id }, create: parcel, update: parcel });
        await writePostings(tx, { storeId: parcel.storeId, parcelId: parcel.id }, change.postings);
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
