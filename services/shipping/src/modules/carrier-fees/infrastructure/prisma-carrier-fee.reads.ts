import { Injectable } from '@nestjs/common';
import { DeliveryTypeSchema, type ExpectedFeesRequest } from '@trackecom/contracts';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { CarrierFeeReads } from '../application/carrier-fees.service.js';

@Injectable()
export class PrismaCarrierFeeReads implements CarrierFeeReads {
  constructor(private readonly prisma: PrismaService) {}

  async routes(storeId: string, { carrier, trackingNumbers }: ExpectedFeesRequest) {
    const rows = await this.prisma.shipment.findMany({
      where: { storeId, carrier, trackingNumber: { in: trackingNumbers } },
      select: { trackingNumber: true, toWilayaCode: true, deliveryType: true },
    });
    return rows.map((row) => ({
      ...row,
      deliveryType: row.deliveryType ? DeliveryTypeSchema.parse(row.deliveryType) : null,
    }));
  }

  rateCard(storeId: string, carrier: string) {
    return this.prisma.rateCard.findMany({
      where: { storeId, carrier },
      select: {
        fromWilaya: true,
        toWilaya: true,
        deliveryType: true,
        price: true,
        returnFee: true,
      },
    });
  }
}
