import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { writeOutbox } from '../../../infrastructure/outbox/write-outbox.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { OutboxMessage } from '../../../shared/outbox-message.js';
import type { NewShipment, ShipmentRepository } from '../application/ports/shipment.repository.js';

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class PrismaShipmentRepository implements ShipmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async exists(storeId: string, reference: string): Promise<boolean> {
    const found = await this.prisma.shipment.findUnique({
      where: { storeId_reference: { storeId, reference } },
      select: { id: true },
    });
    return found !== null;
  }

  async create(shipment: NewShipment, outbox: readonly OutboxMessage[]): Promise<boolean> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.shipment.create({ data: shipment });
        await writeOutbox(tx, outbox);
      });
      return true;
    } catch (error) {
      if (isUniqueViolation(error)) return false;
      throw error;
    }
  }

  async recordFailure(outbox: readonly OutboxMessage[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => writeOutbox(tx, outbox));
  }

  async stopDeskCode(carrier: string, stopDeskId: string): Promise<string | null> {
    const byId = UUID.test(stopDeskId) ? [{ id: stopDeskId }] : [];
    const desk = await this.prisma.stopDesk.findFirst({
      where: { carrier, isActive: true, OR: [...byId, { code: stopDeskId }] },
      select: { code: true },
    });
    return desk?.code ?? null;
  }
}
