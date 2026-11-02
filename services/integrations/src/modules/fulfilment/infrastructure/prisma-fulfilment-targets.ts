import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { ConnectionRecord } from '../../connections/application/ports/connection.repository.js';
import {
  PUBLIC_FIELDS,
  toConnection,
} from '../../connections/infrastructure/prisma-connection.repository.js';
import { FULFILMENT_CONSUMER } from '../application/push-fulfilment.use-case.js';
import type { FulfilmentTarget, FulfilmentTargets } from '../application/ports/fulfilment.ports.js';

@Injectable()
export class PrismaFulfilmentTargets implements FulfilmentTargets {
  constructor(private readonly prisma: PrismaService) {}

  /** Only orders integrations itself sent, from a shop still connected to the same store. */
  async find(origin: { storeId: string; connector: string; externalId: string }) {
    const row = await this.prisma.importedOrder.findFirst({
      where: {
        storeId: origin.storeId,
        externalId: origin.externalId,
        state: 'sent',
        connection: { connector: origin.connector, storeId: origin.storeId },
      },
      select: { externalId: true, connection: { select: PUBLIC_FIELDS } },
    });
    if (!row) return null;
    const target: FulfilmentTarget = {
      connection: toConnection(row.connection),
      externalId: row.externalId,
    };
    return target;
  }

  async alreadyDone(eventId: string): Promise<boolean> {
    const row = await this.prisma.processedEvent.findUnique({
      where: { consumer_eventId: { consumer: FULFILMENT_CONSUMER, eventId } },
    });
    return row !== null;
  }

  async markDone(eventId: string): Promise<void> {
    try {
      await this.prisma.processedEvent.create({ data: { consumer: FULFILMENT_CONSUMER, eventId } });
    } catch (error) {
      const duplicate =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
      if (!duplicate) throw error;
    }
  }

  async needsReconnect(connection: ConnectionRecord): Promise<void> {
    await this.prisma.shopConnection.updateMany({
      where: { id: connection.id },
      data: { status: 'needs_reconnect', lastError: 'connector.auth' },
    });
  }
}
