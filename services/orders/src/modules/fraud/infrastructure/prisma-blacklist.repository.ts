import { Injectable } from '@nestjs/common';
import type { BlacklistEntry, ListBlacklistQuery } from '@trackecom/contracts';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type {
  BlacklistRepository,
  CustomerKey,
  NewBlacklistEntry,
} from '../application/ports/fraud.ports.js';

interface EntryRow {
  id: string;
  phone: string | null;
  name: string | null;
  communeId: number | null;
  reason: string;
  note: string | null;
  expiresAt: Date | null;
  createdBy: string;
  createdAt: Date;
}

const toDto = (row: EntryRow): BlacklistEntry => ({
  id: row.id,
  phone: row.phone,
  name: row.name,
  communeId: row.communeId,
  reason: row.reason as BlacklistEntry['reason'],
  note: row.note,
  expiresAt: row.expiresAt?.toISOString() ?? null,
  createdBy: row.createdBy,
  createdAt: row.createdAt.toISOString(),
});

@Injectable()
export class PrismaBlacklistRepository implements BlacklistRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entry: NewBlacklistEntry): Promise<BlacklistEntry> {
    return toDto(await this.prisma.blacklistEntry.create({ data: entry }));
  }

  async list(storeId: string, query: ListBlacklistQuery) {
    const rows = await this.prisma.blacklistEntry.findMany({
      where: { storeId, ...(query.phone ? { phone: query.phone } : {}) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const items = rows.slice(0, query.limit);
    const nextCursor = rows.length > query.limit ? (items.at(-1)?.id ?? null) : null;
    return { items: items.map(toDto), nextCursor };
  }

  async delete(storeId: string, id: string): Promise<boolean> {
    const { count } = await this.prisma.blacklistEntry.deleteMany({ where: { id, storeId } });
    return count > 0;
  }

  async matches(customer: CustomerKey, now: Date): Promise<boolean> {
    const found = await this.prisma.blacklistEntry.findFirst({
      where: {
        storeId: customer.storeId,
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
          {
            OR: [
              { phone: { in: [...customer.phones] } },
              { nameKey: customer.nameKey, communeId: customer.communeId },
            ],
          },
        ],
      },
      select: { id: true },
    });
    return found !== null;
  }
}
