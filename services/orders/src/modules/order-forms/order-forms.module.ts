import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module.js';
import {
  FORM_LIMITS_STORE,
  ORDER_FORM_STORE,
  STORE_PRICES,
  SUBMISSION_LOG,
} from './application/order-forms.ports.js';
import { OrderFormsService } from './application/order-forms.service.js';
import { PublicFormsService } from './application/public-forms.service.js';
import { SubmissionGate } from './application/submission-gate.js';
import { SubmitFormOrderUseCase } from './application/submit-form-order.use-case.js';
import { PrismaFormLimitsStore } from './infrastructure/prisma-form-limits.store.js';
import { HttpStorePrices } from './infrastructure/http-store-prices.js';
import { PrismaOrderFormStore } from './infrastructure/prisma-order-form.store.js';
import { PrismaSubmissionLog } from './infrastructure/prisma-submission.log.js';
import { FormLimitsController } from './interface/form-limits.controller.js';
import { OrderFormsController } from './interface/order-forms.controller.js';
import { PublicFormsController } from './interface/public-forms.controller.js';

/** Embeddable COD order forms (#134): the seller's forms and the customer's public view. */
@Module({
  imports: [OrdersModule],
  controllers: [FormLimitsController, OrderFormsController, PublicFormsController],
  providers: [
    OrderFormsService,
    PublicFormsService,
    SubmitFormOrderUseCase,
    SubmissionGate,
    { provide: ORDER_FORM_STORE, useClass: PrismaOrderFormStore },
    { provide: STORE_PRICES, useClass: HttpStorePrices },
    { provide: SUBMISSION_LOG, useClass: PrismaSubmissionLog },
    { provide: FORM_LIMITS_STORE, useClass: PrismaFormLimitsStore },
  ],
})
export class OrderFormsModule {}
