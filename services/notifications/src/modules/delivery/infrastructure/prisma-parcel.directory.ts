import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { ParcelDirectory, ParcelRef } from '../application/ports/delivery.ports.js';

const FIELDS = { shipmentId: true, storeId: true, orderId: true, carrier: true, publicCode: true };

@Injectable()
export class PrismaParcelDirectory implements ParcelDirectory {
  constructor(private readonly prisma: PrismaService) {}

  async save(parcel: ParcelRef): Promise<void> {
    await this.prisma.parcel.upsert({
      where: { shipmentId: parcel.shipmentId },
      create: { ...parcel, createdAt: new Date() },
      update: {},
    });
  }

  find(shipmentId: string): Promise<ParcelRef | null> {
    return this.prisma.parcel.findUnique({ where: { shipmentId }, select: FIELDS });
  }
}
