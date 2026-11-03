import { Module } from '@nestjs/common';
import { HttpStorePrices } from '../order-forms/infrastructure/http-store-prices.js';
import { OrdersModule } from '../orders/orders.module.js';
import { ResellerPortalService } from './application/reseller-portal.service.js';
import { RESELLER_PRICES, RESELLERS_STORE } from './application/resellers.ports.js';
import { ResellersService } from './application/resellers.service.js';
import { PrismaResellersStore } from './infrastructure/prisma-resellers.store.js';
import { ResellerCatalogueController } from './interface/reseller-catalogue.controller.js';
import { ResellerPortalController } from './interface/reseller-portal.controller.js';
import { ResellersController } from './interface/resellers.controller.js';

/** Resellers and affiliates (#198). The catalogue controller comes first so its routes win. */
@Module({
  imports: [OrdersModule],
  controllers: [ResellerCatalogueController, ResellersController, ResellerPortalController],
  providers: [
    ResellersService,
    ResellerPortalService,
    { provide: RESELLERS_STORE, useClass: PrismaResellersStore },
    { provide: RESELLER_PRICES, useClass: HttpStorePrices },
  ],
})
export class ResellersModule {}
