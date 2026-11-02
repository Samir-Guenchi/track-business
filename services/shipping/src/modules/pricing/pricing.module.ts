import { Module } from '@nestjs/common';
import { GeoModule } from '../geo/geo.module.js';
import { PRICING_REPOSITORY } from './application/ports/pricing.repository.js';
import { PricingService } from './application/pricing.service.js';
import { PrismaPricingRepository } from './infrastructure/prisma-pricing.repository.js';
import { PricingController } from './interface/pricing.controller.js';

@Module({
  imports: [GeoModule],
  controllers: [PricingController],
  providers: [PricingService, { provide: PRICING_REPOSITORY, useClass: PrismaPricingRepository }],
})
export class PricingModule {}
