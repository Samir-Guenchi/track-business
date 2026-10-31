import { Injectable } from '@nestjs/common';
import {
  type AuditEntry,
  type AuditRecorder,
  type AuditTrailPage,
  type AuditTrailQuery,
  type AuditTrailReader,
  type RetentionCutoffs,
  toAuditEvent,
  toAuditRow,
} from '@trackecom/audit';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';

/** A transaction client or the root client: lets use cases record inside their own transaction. */
export type AuditDb = Pick<Prisma.TransactionClient, 'auditEvent'>;

@Injectable()
export class PrismaAuditStore implements AuditRecorder, AuditTrailReader {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry, db: AuditDb = this.prisma): Promise<void> {
    const row = toAuditRow(entry);
    await db.auditEvent.create({ data: { ...row, changes: row.changes as Prisma.InputJsonValue } });
  }

  async list(query: AuditTrailQuery): Promise<AuditTrailPage> {
    const rows = await this.prisma.auditEvent.findMany({
      where: { storeId: query.storeId, entity: query.entity, entityId: query.entityId },
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const page = rows.slice(0, query.limit);
    const hasMore = rows.length > query.limit;
    return {
      items: page.map(toAuditEvent),
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  /** Daily retention job (docs/audit-log.md). Returns how many rows were touched. */
  async applyRetention(
    cutoffs: RetentionCutoffs,
  ): Promise<{ deleted: number; anonymised: number }> {
    const [deleted, anonymised] = await this.prisma.$transaction([
      this.prisma.auditEvent.deleteMany({
        where: { occurredAt: { lt: cutoffs.deleteEventsBefore } },
      }),
      this.prisma.auditEvent.updateMany({
        where: { occurredAt: { lt: cutoffs.clearIpBefore }, ip: { not: null } },
        data: { ip: null },
      }),
    ]);
    return { deleted: deleted.count, anonymised: anonymised.count };
  }
}
