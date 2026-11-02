import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import type { StorePricesResponse } from '@trackecom/contracts';
import { InternalTokenGuard, Public, ZodValidationPipe } from '@trackecom/service-kit';
import { z } from 'zod';
import { PricingService } from '../application/pricing.service.js';

/**
 * Service-to-service read (ADR-0004): orders shows a store's delivery prices on its public
 * order form (#134). The caller presents the internal token; the store comes from the path.
 */
@Public()
@UseGuards(InternalTokenGuard)
@Controller('internal/stores/:storeId/pricing')
export class InternalPricingController {
  constructor(private readonly pricing: PricingService) {}

  @Get('store-prices')
  storePrices(
    @Param('storeId', new ZodValidationPipe(z.uuid())) storeId: string,
  ): Promise<StorePricesResponse> {
    return this.pricing.getStorePrices(storeId);
  }
}
