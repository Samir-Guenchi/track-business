import { Inject, Injectable } from '@nestjs/common';
import type {
  RateCardRow,
  ShippingQuote,
  ShippingQuoteQuery,
  StorePricesResponse,
  UpdateStorePricesRequestSchema,
} from '@trackecom/contracts';
import type { z } from 'zod';
import { GeoCatalog } from '../../geo/application/geo-catalog.js';
import { UnknownWilayaError } from '../domain/pricing.errors.js';
import { fillPriceGrid, quoteShipping, unknownCodes } from '../domain/shipping-quote.js';
import { PRICING_REPOSITORY, type PricingRepository } from './ports/pricing.repository.js';

type StorePriceUpdate = z.output<typeof UpdateStorePricesRequestSchema>;

/** Store selling prices, the live quote used by the order form, and carrier rate cards. */
@Injectable()
export class PricingService {
  constructor(
    @Inject(PRICING_REPOSITORY) private readonly repository: PricingRepository,
    private readonly geo: GeoCatalog,
  ) {}

  async getStorePrices(storeId: string): Promise<StorePricesResponse> {
    const [codes, saved, rule] = await Promise.all([
      this.currentWilayaCodes(),
      this.repository.listStorePrices(storeId),
      this.repository.freeShippingRule(storeId),
    ]);
    return {
      items: fillPriceGrid([...codes], saved),
      freeShippingFrom: rule.freeShippingFrom,
      freeShippingExcludedWilayas: [...rule.freeShippingExcludedWilayas].sort((a, b) => a - b),
    };
  }

  async updateStorePrices(
    storeId: string,
    request: StorePriceUpdate,
  ): Promise<StorePricesResponse> {
    const excluded = request.freeShippingExcludedWilayas;
    await this.assertKnown([...request.items.map((item) => item.wilayaCode), ...(excluded ?? [])]);
    await this.repository.saveStorePrices({
      storeId,
      items: request.items,
      freeShippingFrom: request.freeShippingFrom,
      freeShippingExcludedWilayas: excluded,
    });
    return this.getStorePrices(storeId);
  }

  async quote(storeId: string, query: ShippingQuoteQuery): Promise<ShippingQuote> {
    const [price, rule] = await Promise.all([
      this.repository.findStorePrice({ storeId, ...query }),
      this.repository.freeShippingRule(storeId),
    ]);
    return quoteShipping({ price, rule, wilayaCode: query.wilayaCode, subtotal: query.subtotal });
  }

  listRateCard(storeId: string, carrier: string): Promise<RateCardRow[]> {
    return this.repository.listRateCard(storeId, carrier);
  }

  async replaceRateCard(card: { storeId: string; carrier: string; rows: RateCardRow[] }) {
    await this.assertKnown(card.rows.flatMap((row) => [row.fromWilaya, row.toWilaya]));
    await this.repository.replaceRateCard({ ...card, importedAt: new Date() });
    return { carrier: card.carrier, rows: card.rows.length };
  }

  private async currentWilayaCodes(): Promise<Set<number>> {
    return new Set((await this.geo.listWilayas()).map((wilaya) => wilaya.code));
  }

  private async assertKnown(codes: readonly number[]): Promise<void> {
    const unknown = unknownCodes(codes, await this.currentWilayaCodes());
    if (unknown.length > 0) throw new UnknownWilayaError(unknown);
  }
}
