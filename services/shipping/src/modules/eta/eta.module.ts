import { Module } from '@nestjs/common';
import { EtaEstimator } from './application/eta-estimator.js';
import { TRANSIT_SAMPLES } from './application/transit-samples.port.js';
import { PrismaTransitSamples } from './infrastructure/prisma-transit-samples.js';

/** Delivery ETA (#55): transit ranges per carrier and wilaya, Friday and holidays aware. */
@Module({
  providers: [EtaEstimator, { provide: TRANSIT_SAMPLES, useClass: PrismaTransitSamples }],
  exports: [EtaEstimator],
})
export class EtaModule {}
