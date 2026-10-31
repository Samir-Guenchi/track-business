import { Injectable } from '@nestjs/common';
import type { EventEnvelope } from '@trackecom/contracts';
import type { OutboxRow, OutboxStore } from '@trackecom/events';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Locks a batch of unpublished rows (SKIP LOCKED, so replicas share the work), publishes them and
 * marks them in the same transaction. A crash after publishing republishes: consumers dedupe.
 */
@Injectable()
export class PrismaOutboxStore implements OutboxStore {
  constructor(private readonly prisma: PrismaService) {}

  relay(
    limit: number,
    publish: (rows: readonly OutboxRow[]) => Promise<string[]>,
  ): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<{ id: string; payload: EventEnvelope }[]>`
        SELECT id, payload FROM outbox_events
        WHERE published_at IS NULL
        ORDER BY occurred_at
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED`;
      if (rows.length === 0) return 0;
      const published = await publish(rows);
      await tx.outboxEvent.updateMany({
        where: { id: { in: published } },
        data: { publishedAt: new Date() },
      });
      return published.length;
    });
  }
}
