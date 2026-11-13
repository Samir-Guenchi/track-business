import { Module } from '@nestjs/common';
import { INTERNAL_TOKEN, InternalTokenGuard } from '@trackecom/service-kit';
import { type Env, ENV } from '../../config/env.schema.js';
import { CARRIER_FEE_READS, CarrierFeesService } from './application/carrier-fees.service.js';
import { PrismaCarrierFeeReads } from './infrastructure/prisma-carrier-fee.reads.js';
import { InternalCarrierFeesController } from './interface/internal-carrier-fees.controller.js';

/** Expected carrier fees per parcel from the rate cards, read by payments (#196). */
@Module({
  controllers: [InternalCarrierFeesController],
  providers: [
    CarrierFeesService,
    { provide: CARRIER_FEE_READS, useClass: PrismaCarrierFeeReads },
    { provide: INTERNAL_TOKEN, inject: [ENV], useFactory: (env: Env) => env.INTERNAL_TOKEN },
    InternalTokenGuard,
  ],
})
export class CarrierFeesModule {}
