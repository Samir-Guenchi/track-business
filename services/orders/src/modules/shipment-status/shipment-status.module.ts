import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module.js';
import { ApplyShipmentStatusUseCase } from './application/apply-shipment-status.use-case.js';
import { ShipmentStatusConsumer } from './infrastructure/shipment-status.consumer.js';

/** Orders follow their parcels: shipping's status events move the order (#32). */
@Module({
  imports: [OrdersModule],
  providers: [ApplyShipmentStatusUseCase, ShipmentStatusConsumer],
  exports: [ApplyShipmentStatusUseCase],
})
export class ShipmentStatusModule {}
