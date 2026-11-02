import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module.js';
import { ORDER_FORM_STORE, STORE_PRICES } from './application/order-forms.ports.js';
import { OrderFormsService } from './application/order-forms.service.js';
import { PublicFormsService } from './application/public-forms.service.js';
import { HttpStorePrices } from './infrastructure/http-store-prices.js';
import { PrismaOrderFormStore } from './infrastructure/prisma-order-form.store.js';
import { OrderFormsController } from './interface/order-forms.controller.js';
import { PublicFormsController } from './interface/public-forms.controller.js';

/** Embeddable COD order forms (#134): the seller's forms and the customer's public view. */
@Module({
  imports: [OrdersModule],
  controllers: [OrderFormsController, PublicFormsController],
  providers: [
    OrderFormsService,
    PublicFormsService,
    { provide: ORDER_FORM_STORE, useClass: PrismaOrderFormStore },
    { provide: STORE_PRICES, useClass: HttpStorePrices },
  ],
  exports: [PublicFormsService, STORE_PRICES],
})
export class OrderFormsModule {}
