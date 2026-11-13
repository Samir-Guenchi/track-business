import { Module } from '@nestjs/common';
import { CarriersModule } from '../carriers/carriers.module.js';
import { GeoModule } from '../geo/geo.module.js';
import { CreateShipmentUseCase } from './application/create-shipment.use-case.js';
import { PlaceNamesResolver } from './application/place-names.js';
import { SHIPMENT_REPOSITORY } from './application/ports/shipment.repository.js';
import { PrismaShipmentRepository } from './infrastructure/prisma-shipment.repository.js';
import { ShipRequestConsumer } from './infrastructure/ship-request.consumer.js';

/** Turns orders' ship requests into carrier parcels (#31 backend, #32). */
@Module({
  imports: [CarriersModule, GeoModule],
  providers: [
    CreateShipmentUseCase,
    PlaceNamesResolver,
    ShipRequestConsumer,
    { provide: SHIPMENT_REPOSITORY, useClass: PrismaShipmentRepository },
  ],
  exports: [CreateShipmentUseCase],
})
export class ShipmentsModule {}
