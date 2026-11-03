import { Module } from '@nestjs/common';
import {
  OPEN_PARCELS,
  STUCK_CLOCK,
  StuckParcelsService,
} from './application/stuck-parcels.service.js';
import { PrismaOpenParcels } from './infrastructure/prisma-open-parcels.js';
import { StuckParcelsController } from './interface/stuck-parcels.controller.js';

/** Stuck parcel alerts per carrier and wilaya (#197). */
@Module({
  controllers: [StuckParcelsController],
  providers: [
    StuckParcelsService,
    { provide: OPEN_PARCELS, useClass: PrismaOpenParcels },
    { provide: STUCK_CLOCK, useValue: () => new Date() },
  ],
})
export class StuckParcelsModule {}
