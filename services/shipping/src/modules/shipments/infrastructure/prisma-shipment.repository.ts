import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { writeOutbox } from '../../../infrastructure/outbox/write-outbox.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { OutboxMessage } from '../../../shared/outbox-message.js';
import type { NewShipment, ShipmentRepository } from '../application/ports/shipment.repository.js';

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

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
}
