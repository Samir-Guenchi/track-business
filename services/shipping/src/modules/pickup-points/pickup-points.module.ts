import { Module } from '@nestjs/common';
import { PickupParcelsService } from './application/pickup-parcels.service.js';
import { PICKUP_POINTS_STORE } from './application/pickup-points.ports.js';
import { PickupPointsService } from './application/pickup-points.service.js';
import { PublicPickupService } from './application/public-pickup.service.js';
import { PrismaPickupPointsStore } from './infrastructure/prisma-pickup-points.store.js';
import { PickupParcelsController } from './interface/pickup-parcels.controller.js';
import { PickupPointsController } from './interface/pickup-points.controller.js';
import { PublicPickupController } from './interface/public-pickup.controller.js';

/** Partner pickup points in local shops (#202). */
@Module({
  controllers: [PickupPointsController, PickupParcelsController, PublicPickupController],
  providers: [
    PickupPointsService,
    PickupParcelsService,
    PublicPickupService,
    { provide: PICKUP_POINTS_STORE, useClass: PrismaPickupPointsStore },
  ],
})
export class PickupPointsModule {}
