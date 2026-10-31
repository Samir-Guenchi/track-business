import { Injectable } from '@nestjs/common';
import { PayoutLineInputSchema, type PayoutStatus } from '@trackecom/contracts';
import { z } from 'zod';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { ParcelRecord } from '../application/ports/money.repository.js';
import type {
  ClaimedPayout,
  NewPayout,
  PayoutCompletion,
  PayoutRecord,
  PayoutRepository,
} from '../application/ports/payout.repository.js';
import { PayoutAlreadyImportedError } from '../domain/payout.errors.js';
import { writeCompletion } from './payout-completion.js';
import { toParcelRecord } from './prisma-money.repository.js';

const LinesSchema = z.array(PayoutLineInputSchema);

type PayoutRow = Omit<PayoutRecord, 'status'> & { status: string };
const toRecord = (row: PayoutRow): PayoutRecord => ({
  id: row.id,
  storeId: row.storeId,
  status: row.status as PayoutStatus,
  carrier: row.carrier,
  reference: row.reference,
  paidAt: row.paidAt,
  totalAmount: row.totalAmount,
  codAmount: row.codAmount,
  fees: row.fees,
  lineCount: row.lineCount,
  matched: row.matched,
  flagged: row.flagged,
  importedAt: row.importedAt,
});

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

@Injectable()
export class PrismaPayoutRepository implements PayoutRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(payout: NewPayout): Promise<PayoutRecord> {
    const { totals, lines, ...fields } = payout;
    try {
      const row = await this.prisma.payout.create({
        data: { ...fields, ...totals, lines: lines.map((line) => ({ ...line })) },
      });
      return toRecord(row);
    } catch (error) {
      if (isUniqueViolation(error)) throw new PayoutAlreadyImportedError();
      throw error;
    }
  }

  async find(storeId: string, id: string): Promise<PayoutRecord | null> {
    const row = await this.prisma.payout.findFirst({ where: { id, storeId } });
    return row ? toRecord(row) : null;
  }

  async claimNext(leaseMs: number): Promise<ClaimedPayout | null> {
    const rows = await this.prisma.$queryRaw<(ClaimedPayout & { lines: unknown })[]>`
      UPDATE payouts SET claimed_until = now() + ${leaseMs} * interval '1 millisecond'
      WHERE id = (
        SELECT id FROM payouts
        WHERE status = 'processing' AND (claimed_until IS NULL OR claimed_until < now())
        ORDER BY imported_at
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, store_id AS "storeId", carrier, reference, paid_at AS "paidAt",
        total_amount AS "totalAmount", raw_lines AS "lines"`;
    const [row] = rows;
    return row ? { ...row, lines: LinesSchema.parse(row.lines) } : null;
  }

  async release(payoutId: string): Promise<void> {
    await this.prisma.payout.update({ where: { id: payoutId }, data: { claimedUntil: null } });
  }

  async findParcels(payout: ClaimedPayout): Promise<ParcelRecord[]> {
    const rows = await this.prisma.parcel.findMany({
      where: {
        storeId: payout.storeId,
        carrier: payout.carrier,
        trackingNumber: { in: payout.lines.map((line) => line.trackingNumber) },
      },
    });
    return rows.map(toParcelRecord);
  }

  complete(completion: PayoutCompletion): Promise<void> {
    return this.prisma.$transaction((tx) => writeCompletion(tx, completion), {
      timeout: 120_000,
    });
  }
}
