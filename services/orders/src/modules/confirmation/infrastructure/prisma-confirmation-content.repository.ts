import { Injectable } from '@nestjs/common';
import { type CallScript, type ScriptLanguage, ScriptLanguageSchema } from '@trackecom/contracts';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { ConfirmationContentRepository } from '../application/ports/confirmation-content.repository.js';
import type { AgentTotals } from '../domain/agent-stats.js';

interface TotalsRow {
  agent_id: string;
  calls: bigint;
  confirmed: bigint;
  cancelled: bigint;
  total_duration: bigint;
  first_call_at: Date;
  last_call_at: Date;
}

@Injectable()
export class PrismaConfirmationContentRepository implements ConfirmationContentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async scripts(storeId: string): Promise<CallScript[]> {
    const rows = await this.prisma.callScript.findMany({
      where: { storeId },
      orderBy: { language: 'asc' },
    });
    return rows.map((row) => ({
      language: ScriptLanguageSchema.parse(row.language),
      body: row.body,
    }));
  }

  async script(storeId: string, language: ScriptLanguage): Promise<string | null> {
    const row = await this.prisma.callScript.findUnique({
      where: { storeId_language: { storeId, language } },
    });
    return row?.body ?? null;
  }

  async saveScript(storeId: string, { language, body }: CallScript): Promise<void> {
    await this.prisma.callScript.upsert({
      where: { storeId_language: { storeId, language } },
      create: { storeId, language, body },
      update: { body },
    });
  }

  /** One grouped scan of the (store_id, agent_id, at) index. */
  async agentTotals(storeId: string, period: { from: Date; to: Date }): Promise<AgentTotals[]> {
    const rows = await this.prisma.$queryRaw<TotalsRow[]>(Prisma.sql`
      SELECT agent_id::text AS agent_id,
        count(*) AS calls,
        count(*) FILTER (WHERE outcome = 'confirmed') AS confirmed,
        count(*) FILTER (WHERE outcome = 'cancelled') AS cancelled,
        coalesce(sum(duration_sec), 0) AS total_duration,
        min(at) AS first_call_at,
        max(at) AS last_call_at
      FROM call_attempts
      WHERE store_id = ${storeId}::uuid AND at >= ${period.from} AND at < ${period.to}
      GROUP BY agent_id
      ORDER BY calls DESC`);
    return rows.map((row) => ({
      agentId: row.agent_id,
      calls: Number(row.calls),
      confirmed: Number(row.confirmed),
      cancelled: Number(row.cancelled),
      totalDurationSec: Number(row.total_duration),
      firstCallAt: row.first_call_at,
      lastCallAt: row.last_call_at,
    }));
  }
}
