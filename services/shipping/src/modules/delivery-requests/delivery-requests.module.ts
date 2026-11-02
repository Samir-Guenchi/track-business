import { Module } from '@nestjs/common';
import { PricingModule } from '../pricing/pricing.module.js';
import {
  DELIVERY_FEES,
  DELIVERY_REQUESTS_CLOCK,
  DELIVERY_REQUESTS_STORE,
} from './application/delivery-requests.ports.js';
import { PublicDeliveryChoicesService } from './application/public-delivery-choices.service.js';
import { SellerDeliveryRequestsService } from './application/seller-delivery-requests.service.js';
import { PricingDeliveryFees } from './infrastructure/pricing-delivery-fees.js';
import { PrismaDeliveryRequestsStore } from './infrastructure/prisma-delivery-requests.store.js';
import { DeliveryRequestsController } from './interface/delivery-requests.controller.js';
import { PublicDeliveryChoicesController } from './interface/public-delivery-choices.controller.js';

/** Customer delivery choices from the tracking link, and the seller's change list (#136). */
@Module({
  imports: [PricingModule],
  controllers: [PublicDeliveryChoicesController, DeliveryRequestsController],
  providers: [
    PublicDeliveryChoicesService,
    SellerDeliveryRequestsService,
    { provide: DELIVERY_REQUESTS_STORE, useClass: PrismaDeliveryRequestsStore },
    { provide: DELIVERY_FEES, useClass: PricingDeliveryFees },
    { provide: DELIVERY_REQUESTS_CLOCK, useValue: () => new Date() },
  ],
})
export class DeliveryRequestsModule {}
