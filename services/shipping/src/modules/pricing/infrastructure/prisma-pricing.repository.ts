import { Injectable } from '@nestjs/common';
import { type DeliveryType, DeliveryTypeSchema, type RateCardRow } from '@trackecom/contracts';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type {
  PriceLookup,
  PricingRepository,
  RateCardImport,
  StorePriceChanges,
} from '../application/ports/pricing.repository.js';

const deliveryType = (value: string): DeliveryType => DeliveryTypeSchema.parse(value);

/** Every query filters on storeId first; it is the leading column of each primary key. */
@Injectable()
export class PrismaPricingRepository implements PricingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listStorePrices(storeId: string) {
    const rows = await this.prisma.storePrice.findMany({ where: { storeId } });
    return rows.map((row) => ({
      wilayaCode: row.wilayaCode,
      deliveryType: deliveryType(row.deliveryType),
      price: row.price,
    }));
  }

  async findStorePrice({ storeId, wilayaCode, deliveryType: type }: PriceLookup) {
    const row = await this.prisma.storePrice.findUnique({
      where: { storeId_wilayaCode_deliveryType: { storeId, wilayaCode, deliveryType: type } },
    });
    return row?.price ?? null;
  }

  async freeShippingFrom(storeId: string) {
    const settings = await this.prisma.storeShippingSettings.findUnique({ where: { storeId } });
    return settings?.freeShippingFrom ?? null;
  }

  async saveStorePrices({ storeId, items, freeShippingFrom }: StorePriceChanges) {
    const upserts = items.map(({ wilayaCode, deliveryType: type, price }) =>
      this.prisma.storePrice.upsert({
        where: { storeId_wilayaCode_deliveryType: { storeId, wilayaCode, deliveryType: type } },
        create: { storeId, wilayaCode, deliveryType: type, price },
        update: { price },
      }),
    );
    const settings =
      freeShippingFrom === undefined
        ? []
        : [
            this.prisma.storeShippingSettings.upsert({
              where: { storeId },
              create: { storeId, freeShippingFrom },
              update: { freeShippingFrom },
            }),
          ];
    await this.prisma.$transaction([...upserts, ...settings]);
  }

  async listRateCard(storeId: string, carrier: string): Promise<RateCardRow[]> {
    const rows = await this.prisma.rateCard.findMany({
      where: { storeId, carrier },
      orderBy: [{ fromWilaya: 'asc' }, { toWilaya: 'asc' }, { deliveryType: 'asc' }],
    });
    return rows.map((row) => ({
      fromWilaya: row.fromWilaya,
      toWilaya: row.toWilaya,
      deliveryType: deliveryType(row.deliveryType),
      price: row.price,
      returnFee: row.returnFee,
      weightLimitGrams: row.weightLimitGrams,
    }));
  }

  /** The import replaces the whole card at once, so a half-applied file is never visible. */
  async replaceRateCard({ storeId, carrier, rows, importedAt }: RateCardImport) {
    await this.prisma.$transaction([
      this.prisma.rateCard.deleteMany({ where: { storeId, carrier } }),
      this.prisma.rateCard.createMany({
        data: rows.map((row) => ({ storeId, carrier, importedAt, ...row })),
      }),
    ]);
  }
}
