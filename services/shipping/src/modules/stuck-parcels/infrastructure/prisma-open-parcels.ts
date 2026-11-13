import { Injectable } from '@nestjs/common';
import { ParcelStatusSchema, STUCK_AFTER_DELIVERY_DAYS } from '@trackecom/contracts';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { OpenParcels } from '../application/stuck-parcels.service.js';

const WATCHED = Object.keys(STUCK_AFTER_DELIVERY_DAYS);
/** A store has at most a few thousand parcels on the road; this caps a pathological backlog. */
const MAX_ROWS = 5_000;

@Injectable()
export class PrismaOpenParcels implements OpenParcels {
  constructor(private readonly prisma: PrismaService) {}

  async idleSince({ storeId, before, carrier }: Parameters<OpenParcels['idleSince']>[0]) {
    const rows = await this.prisma.shipment.findMany({
      where: {
        storeId,
        status: { in: WATCHED },
        ...(carrier ? { carrier } : {}),
        OR: [{ lastEventAt: { lt: before } }, { lastEventAt: null, createdAt: { lt: before } }],
      },
      select: {
        id: true,
        orderId: true,
        carrier: true,
        trackingNumber: true,
        toWilayaCode: true,
        status: true,
        lastEventAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
      take: MAX_ROWS,
    });
    return rows.map(({ id, status, lastEventAt, createdAt, ...row }) => ({
      ...row,
      shipmentId: id,
      status: ParcelStatusSchema.parse(status),
      lastMoveAt: lastEventAt ?? createdAt,
    }));
  }
}
