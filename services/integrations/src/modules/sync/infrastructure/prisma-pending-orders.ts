import { Injectable } from '@nestjs/common';
import { ImportProblemSchema } from '@trackecom/contracts';
import type { ExternalOrder } from '@trackecom/connectors';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import {
  PUBLIC_FIELDS,
  toConnection,
} from '../../connections/infrastructure/prisma-connection.repository.js';
import type { PendingKey, PendingOrder, PendingOrders } from '../application/ports/sync.ports.js';

const LIST_LIMIT = 200;
const WITH_CONNECTION = { connection: { select: PUBLIC_FIELDS } } as const;

type Row = {
  problem: string | null;
  pending: unknown;
  createdAt: Date;
  connection: Parameters<typeof toConnection>[0];
};

/** The stored shop order is JSON: its dates come back as strings. */
function toPending(row: Row): PendingOrder | null {
  const order = row.pending as (ExternalOrder & { createdAt: string; updatedAt: string }) | null;
  if (!order) return null;
  return {
    connection: toConnection(row.connection),
    order: { ...order, createdAt: new Date(order.createdAt), updatedAt: new Date(order.updatedAt) },
    problem: ImportProblemSchema.catch('invalid').parse(row.problem),
    receivedAt: row.createdAt,
  };
}

@Injectable()
export class PrismaPendingOrders implements PendingOrders {
  constructor(private readonly prisma: PrismaService) {}

  async list(storeId: string): Promise<PendingOrder[]> {
    const rows = await this.prisma.importedOrder.findMany({
      where: { storeId, state: 'needs_fix' },
      include: WITH_CONNECTION,
      orderBy: { createdAt: 'asc' },
      take: LIST_LIMIT,
    });
    return rows.map(toPending).filter((row) => row !== null);
  }

  async find(storeId: string, key: PendingKey): Promise<PendingOrder | null> {
    const row = await this.prisma.importedOrder.findFirst({
      where: {
        connectionId: key.connectionId,
        externalId: key.externalId,
        storeId,
        state: 'needs_fix',
      },
      include: WITH_CONNECTION,
    });
    return row ? toPending(row) : null;
  }
}
