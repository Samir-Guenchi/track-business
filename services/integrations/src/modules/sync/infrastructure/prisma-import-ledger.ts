import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { writeOutbox } from '../../../infrastructure/outbox/write-outbox.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { OutboxMessage } from '../../../shared/outbox-message.js';
import type {
  ImportLedger,
  ImportState,
  KnownOrder,
  LedgerEntry,
} from '../application/ports/sync.ports.js';

const STATES: readonly string[] = ['sent', 'needs_fix', 'skipped'];
const stateOf = (value: string): ImportState =>
  STATES.includes(value) ? (value as ImportState) : 'skipped';

@Injectable()
export class PrismaImportLedger implements ImportLedger {
  constructor(private readonly prisma: PrismaService) {}

  async known(connectionId: string, externalIds: readonly string[]) {
    const rows = await this.prisma.importedOrder.findMany({
      where: { connectionId, externalId: { in: [...externalIds] } },
      select: { externalId: true, shopUpdatedAt: true, state: true },
    });
    return new Map<string, KnownOrder>(
      rows.map((row) => [
        row.externalId,
        { shopUpdatedAt: row.shopUpdatedAt, state: stateOf(row.state) },
      ]),
    );
  }

  async record(entry: LedgerEntry, messages: readonly OutboxMessage[]): Promise<void> {
    const { connection, order, state, problem } = entry;
    const key = { connectionId: connection.id, externalId: order.externalId };
    const now = new Date();
    const data = {
      externalName: order.name,
      state,
      problem,
      pending: state === 'needs_fix' ? (order as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
      shopUpdatedAt: order.updatedAt,
      updatedAt: now,
    };
    await this.prisma.$transaction(async (tx) => {
      const before = await tx.importedOrder.findUnique({
        where: { connectionId_externalId: key },
        select: { state: true },
      });
      await tx.importedOrder.upsert({
        where: { connectionId_externalId: key },
        create: { ...key, storeId: connection.storeId, ...data, createdAt: now },
        update: data,
      });
      if (state === 'sent' && before?.state !== 'sent') {
        await tx.shopConnection.update({
          where: { id: connection.id },
          data: { ordersImported: { increment: 1 } },
        });
      }
      await writeOutbox(tx, messages);
    });
  }
}
