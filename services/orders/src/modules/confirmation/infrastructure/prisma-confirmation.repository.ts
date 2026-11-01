import { Injectable } from '@nestjs/common';
import {
  CallOutcomeSchema,
  type ConfirmationSettings,
  ConfirmationSettingsSchema,
} from '@trackecom/contracts';
import type { CallAttempt as CallAttemptRow } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { writeOrderEffects, writeOrderVersion } from '../../orders/infrastructure/order-writes.js';
import type {
  AnswerStatsQuery,
  CallAttemptRecord,
  ClaimRequest,
  ConfirmationRepository,
  QueueState,
  RecordedCall,
} from '../application/ports/confirmation.repository.js';
import type { HourlyAttempts } from '../domain/best-time.js';
import { answerStatsSql } from './answer-stats.sql.js';
import { claimNextSql } from './claim-next.sql.js';

const toAttempt = (row: CallAttemptRow): CallAttemptRecord => ({
  ...row,
  outcome: CallOutcomeSchema.parse(row.outcome),
});

const QUEUE_FIELDS = {
  lockedBy: true,
  lockedUntil: true,
  nextCallAt: true,
  unreachedCalls: true,
  callsToday: true,
  lastCallDay: true,
} as const;

/** Every query is scoped by storeId from the verified context. */
@Injectable()
export class PrismaConfirmationRepository implements ConfirmationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async settings(storeId: string): Promise<ConfirmationSettings> {
    const row = await this.prisma.confirmationSettings.findUnique({ where: { storeId } });
    if (!row) return ConfirmationSettingsSchema.parse({});
    return ConfirmationSettingsSchema.parse({
      assignment: row.assignment,
      agentRules: row.agentRules,
      maxAttemptsPerDay: row.maxAttemptsPerDay,
      unreachableAfter: row.unreachableAfter,
    });
  }

  async saveSettings(storeId: string, settings: ConfirmationSettings): Promise<void> {
    await this.prisma.confirmationSettings.upsert({
      where: { storeId },
      create: { storeId, ...settings },
      update: settings,
    });
  }

  async claimNext(request: ClaimRequest): Promise<string | null> {
    const rows = await this.prisma.$queryRaw<{ id: string }[]>(claimNextSql(request));
    return rows[0]?.id ?? null;
  }

  queueState(storeId: string, orderId: string): Promise<QueueState | null> {
    return this.prisma.order.findFirst({
      where: { id: orderId, storeId, deletedAt: null },
      select: QUEUE_FIELDS,
    });
  }

  async release(storeId: string, orderId: string, agentId: string): Promise<boolean> {
    const { count } = await this.prisma.order.updateMany({
      where: { id: orderId, storeId, lockedBy: agentId },
      data: { lockedBy: null, lockedUntil: null },
    });
    return count === 1;
  }

  async attempts(storeId: string, orderId: string, limit: number) {
    const rows = await this.prisma.callAttempt.findMany({
      where: { storeId, orderId },
      orderBy: { at: 'desc' },
      take: limit,
    });
    return rows.map(toAttempt);
  }

  async recordCall({ order, queue, attempt, effects }: RecordedCall): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await writeOrderVersion(tx, order, {
        status: order.status,
        postponedUntil: order.postponedUntil,
        statusChangedAt: order.statusChangedAt,
        version: order.version,
        updatedAt: order.updatedAt,
        ...queue,
      });
      await tx.callAttempt.create({ data: attempt });
      await writeOrderEffects(tx, effects);
    });
  }

  answerStats(query: AnswerStatsQuery): Promise<HourlyAttempts[]> {
    return this.prisma.$queryRaw<HourlyAttempts[]>(answerStatsSql(query));
  }
}
