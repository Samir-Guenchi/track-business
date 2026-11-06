import { Injectable } from '@nestjs/common';
import { type AuditEntry, toAuditRow } from '@trackecom/audit';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { markConsumed } from '../../orders/infrastructure/order-writes.js';
import type { OrderHistoryWriter } from '../application/order-history.port.js';

@Injectable()
export class PrismaOrderHistoryWriter implements OrderHistoryWriter {
  constructor(private readonly prisma: PrismaService) {}

  async append(entry: AuditEntry, consumed: { consumer: string; eventId: string }): Promise<void> {
    const audit = toAuditRow(entry);
    await this.prisma.$transaction(async (tx) => {
      await markConsumed(tx, consumed);
      await tx.auditEvent.create({
        data: { ...audit, changes: audit.changes as Prisma.InputJsonValue },
      });
    });
  }
}
