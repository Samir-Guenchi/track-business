import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import {
  CarrierCodeSchema,
  type RateCardRow,
  type ReplaceRateCardRequest,
  ReplaceRateCardRequestSchema,
  type ShippingQuote,
  type ShippingQuoteQuery,
  ShippingQuoteQuerySchema,
  type StorePricesResponse,
  UpdateStorePricesRequestSchema,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import type { z } from 'zod';
import { PricingService } from '../application/pricing.service.js';

const CarrierPipe = new ZodValidationPipe(CarrierCodeSchema);

/** Prices of the store in `x-store-id`. */
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Get('store-prices')
  @RequirePermission('store.read')
  storePrices(@CurrentStore() store: StoreContext): Promise<StorePricesResponse> {
    return this.pricing.getStorePrices(store.storeId);
  }

  @Put('store-prices')
  @RequirePermission('store.update')
  updateStorePrices(
    @Body(new ZodValidationPipe(UpdateStorePricesRequestSchema))
    body: z.output<typeof UpdateStorePricesRequestSchema>,
    @CurrentStore() store: StoreContext,
  ): Promise<StorePricesResponse> {
    return this.pricing.updateStorePrices(store.storeId, body);
  }

  @Get('quote')
  @RequirePermission('orders.read')
  quote(
    @Query(new ZodValidationPipe(ShippingQuoteQuerySchema)) query: ShippingQuoteQuery,
    @CurrentStore() store: StoreContext,
  ): Promise<ShippingQuote> {
    return this.pricing.quote(store.storeId, query);
  }

  @Get('rate-cards/:carrier')
  @RequirePermission('store.read')
  async rateCard(
    @Param('carrier', CarrierPipe) carrier: string,
    @CurrentStore() store: StoreContext,
  ): Promise<{ rows: RateCardRow[] }> {
    return { rows: await this.pricing.listRateCard(store.storeId, carrier) };
  }

  @Put('rate-cards/:carrier')
  @RequirePermission('store.update')
  replaceRateCard(
    @Param('carrier', CarrierPipe) carrier: string,
    @Body(new ZodValidationPipe(ReplaceRateCardRequestSchema)) body: ReplaceRateCardRequest,
    @CurrentStore() store: StoreContext,
  ): Promise<{ carrier: string; rows: number }> {
    return this.pricing.replaceRateCard({ storeId: store.storeId, carrier, rows: body.rows });
  }
}
