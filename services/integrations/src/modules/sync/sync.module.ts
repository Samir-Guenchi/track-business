import { Module } from '@nestjs/common';
import { ConnectionsModule } from '../connections/connections.module.js';
import { LocationResolver } from './application/location-resolver.js';
import { OrderImporter } from './application/order-importer.js';
import { PendingOrdersService } from './application/pending-orders.service.js';
import { SYNC_PORTS } from './application/ports/sync.ports.js';
import { ShopPager } from './application/shop-pager.js';
import { ShopSync } from './application/shop-sync.js';
import { WebhookIntake } from './application/webhook-intake.js';
import { HttpGeoReference } from './infrastructure/http-geo-reference.js';
import { PrismaImportLedger } from './infrastructure/prisma-import-ledger.js';
import { PrismaPendingOrders } from './infrastructure/prisma-pending-orders.js';
import { PrismaSyncClaims } from './infrastructure/prisma-sync-claims.js';
import { ShopSyncWorker } from './infrastructure/shop-sync.worker.js';
import { PendingOrdersController } from './interface/pending-orders.controller.js';
import { ShopWebhookController } from './interface/shop-webhook.controller.js';

/** Shop orders in, from polling, backfill and webhooks, all through one importer (#47). */
@Module({
  imports: [ConnectionsModule],
  controllers: [ShopWebhookController, PendingOrdersController],
  providers: [
    WebhookIntake,
    PendingOrdersService,
    LocationResolver,
    OrderImporter,
    ShopPager,
    ShopSync,
    ShopSyncWorker,
    { provide: SYNC_PORTS.geo, useClass: HttpGeoReference },
    { provide: SYNC_PORTS.ledger, useClass: PrismaImportLedger },
    { provide: SYNC_PORTS.claims, useClass: PrismaSyncClaims },
    { provide: SYNC_PORTS.pending, useClass: PrismaPendingOrders },
  ],
  exports: [OrderImporter],
})
export class SyncModule {}
