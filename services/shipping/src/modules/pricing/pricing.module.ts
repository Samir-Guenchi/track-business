import { Module } from '@nestjs/common';
import { INTERNAL_TOKEN, InternalTokenGuard } from '@trackecom/service-kit';
import { type Env, ENV } from '../../config/env.schema.js';
import { GeoModule } from '../geo/geo.module.js';
import { PRICING_REPOSITORY } from './application/ports/pricing.repository.js';
import { PricingService } from './application/pricing.service.js';
import { PrismaPricingRepository } from './infrastructure/prisma-pricing.repository.js';
import { InternalPricingController } from './interface/internal-pricing.controller.js';
import { PricingController } from './interface/pricing.controller.js';

@Module({
  imports: [GeoModule],
  controllers: [PricingController, InternalPricingController],
  providers: [
    PricingService,
    { provide: PRICING_REPOSITORY, useClass: PrismaPricingRepository },
    { provide: INTERNAL_TOKEN, inject: [ENV], useFactory: (env: Env) => env.INTERNAL_TOKEN },
    InternalTokenGuard,
  ],
})
export class PricingModule {}
