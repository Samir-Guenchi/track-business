import { Injectable } from '@nestjs/common';
import { toAuditRow } from '@trackecom/audit';
import type {
  FollowupMetric,
  FollowupMetricsQuery,
  ListFollowupsQuery,
} from '@trackecom/contracts';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { markConsumed, writeOutbox } from '../../orders/infrastructure/order-writes.js';
import type {
  FollowupEffects,
  FollowupPage,
  FollowupStore,
} from '../application/followup.ports.js';
import type { FollowupRecord } from '../domain/followup.js';
import { decodeCursor, encodeCursor, listWhere } from './followup-queries.js';
import { toMetrics, toRecord } from './followup-mapping.js';

@Injectable()
export class PrismaFollowupStore implements FollowupStore {
  constructor(private readonly prisma: PrismaService) {}

  async findById(storeId: string, id: string): Promise<FollowupRecord | null> {
    const row = await this.prisma.deliveryFollowup.findFirst({ where: { storeId, id } });
    return row && toRecord(row);
  }

  async findByShipment(storeId: string, shipmentId: string): Promise<FollowupRecord | null> {
    const row = await this.prisma.deliveryFollowup.findUnique({
      where: { storeId_shipmentId: { storeId, shipmentId } },
    });
    return row && toRecord(row);
  }

  async save(record: FollowupRecord, effects: FollowupEffects): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.deliveryFollowup.upsert({
        where: { id: record.id },
        create: record,
        update: record,
      });
      if (effects.audit) {
        const audit = toAuditRow(effects.audit);
        await tx.auditEvent.create({
          data: { ...audit, changes: audit.changes as Prisma.InputJsonValue },
        });
      }
      await writeOutbox(tx, effects.events);
      if (effects.consumed) await markConsumed(tx, effects.consumed);
    });
  }

  async list(storeId: string, query: ListFollowupsQuery, now: Date): Promise<FollowupPage> {
    const rows = await this.prisma.deliveryFollowup.findMany({
      where: { AND: [listWhere(storeId, query, now), decodeCursor(query.cursor)] },
      orderBy: [{ dueAt: 'asc' }, { id: 'asc' }],
      take: query.limit + 1,
    });
    const items = rows.slice(0, query.limit).map(toRecord);
    const last = items.at(-1);
    return { items, nextCursor: rows.length > query.limit && last ? encodeCursor(last) : null };
  }

  async metrics(storeId: string, query: FollowupMetricsQuery): Promise<FollowupMetric[]> {
    const groups = await this.prisma.deliveryFollowup.groupBy({
      by: ['carrier', 'reason', 'outcome'],
      where: {
        storeId,
        createdAt: {
          ...(query.from ? { gte: new Date(query.from) } : {}),
          ...(query.to ? { lt: new Date(query.to) } : {}),
        },
      },
      _count: { _all: true },
    });
    return toMetrics(groups.map((group) => ({ ...group, count: group._count._all })));
  }
}
