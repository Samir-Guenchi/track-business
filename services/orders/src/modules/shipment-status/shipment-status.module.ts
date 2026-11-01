import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module.js';
import { ApplyShipmentStatusUseCase } from './application/apply-shipment-status.use-case.js';
import { ShipOrdersUseCase } from './application/ship-orders.use-case.js';
import { SystemStatusChange } from './application/system-status-change.js';
import { ShipmentStatusConsumer } from './infrastructure/shipment-status.consumer.js';
import { ShipOrdersController } from './interface/ship-orders.controller.js';

/** Orders and their parcels: the ship request out, shipping's answers and scans back in. */
@Module({
  imports: [OrdersModule],
  controllers: [ShipOrdersController],
  providers: [
    ShipOrdersUseCase,
    ApplyShipmentStatusUseCase,
    SystemStatusChange,
    ShipmentStatusConsumer,
  ],
  exports: [ApplyShipmentStatusUseCase, SystemStatusChange],
})
export class ShipmentStatusModule {}
