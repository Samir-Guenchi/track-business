import { Injectable } from '@nestjs/common';
import type { ListParcelMoneyQuery, ListPayoutsQuery } from '@trackecom/contracts';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { ParcelRecord } from '../application/ports/money.repository.js';
import type { MoneyReads, Page } from '../application/ports/money-reads.js';
import type { PayoutRecord } from '../application/ports/payout.repository.js';
import { toParcelRecord } from './prisma-money.repository.js';
import { toPayoutRecord } from './prisma-payout.repository.js';

function pageOf<T extends { id: string }>(rows: T[], limit: number): Page<T> {
  const items = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? (items.at(-1)?.id ?? null) : null;
  return { items, nextCursor };
}

const cursorArgs = (query: { cursor?: string | undefined; limit: number }) => ({
  take: query.limit + 1,
  ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
});

/** The lists behind the COD screens, newest first, always within one store. */
@Injectable()
export class PrismaMoneyReads implements MoneyReads {
  constructor(private readonly prisma: PrismaService) {}

  async listParcels(storeId: string, query: ListParcelMoneyQuery): Promise<Page<ParcelRecord>> {
    const rows = await this.prisma.parcel.findMany({
      where: {
        storeId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.carrier ? { carrier: query.carrier } : {}),
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      ...cursorArgs(query),
    });
    return pageOf(rows.map(toParcelRecord), query.limit);
  }

  async listPayouts(storeId: string, query: ListPayoutsQuery): Promise<Page<PayoutRecord>> {
    const rows = await this.prisma.payout.findMany({
      where: { storeId, ...(query.carrier ? { carrier: query.carrier } : {}) },
      orderBy: [{ paidAt: 'desc' }, { id: 'desc' }],
      ...cursorArgs(query),
    });
    return pageOf(rows.map(toPayoutRecord), query.limit);
  }
}
