import { Module } from '@nestjs/common';
import { PublicReturnRequestsService } from './application/public-return-requests.service.js';
import {
  RETURN_REQUESTS_CLOCK,
  RETURN_REQUESTS_STORE,
} from './application/return-requests.ports.js';
import { SellerReturnRequestsService } from './application/seller-return-requests.service.js';
import { PrismaReturnRequestsStore } from './infrastructure/prisma-return-requests.store.js';
import { PublicReturnRequestsController } from './interface/public-return-requests.controller.js';
import { ReturnRequestsController } from './interface/return-requests.controller.js';

/** Customer return and exchange requests from the tracking page (#201). */
@Module({
  controllers: [PublicReturnRequestsController, ReturnRequestsController],
  providers: [
    PublicReturnRequestsService,
    SellerReturnRequestsService,
    { provide: RETURN_REQUESTS_STORE, useClass: PrismaReturnRequestsStore },
    { provide: RETURN_REQUESTS_CLOCK, useValue: () => new Date() },
  ],
})
export class ReturnRequestsModule {}
