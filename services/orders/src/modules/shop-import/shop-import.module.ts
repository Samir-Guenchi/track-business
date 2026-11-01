import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module.js';
import { ShipmentStatusModule } from '../shipment-status/shipment-status.module.js';
import { ImportShopOrderUseCase } from './application/import-shop-order.use-case.js';
import { ShopImportConsumer } from './infrastructure/shop-import.consumer.js';

/** Shop orders (Shopify, WooCommerce, YouCan) arriving from integrations as events (#47). */
@Module({
  imports: [OrdersModule, ShipmentStatusModule],
  providers: [ImportShopOrderUseCase, ShopImportConsumer],
  exports: [ImportShopOrderUseCase],
})
export class ShopImportModule {}
