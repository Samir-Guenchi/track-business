import { Module } from '@nestjs/common';
import { ConnectionsModule } from '../connections/connections.module.js';
import { LocationResolver } from './application/location-resolver.js';
import { OrderImporter } from './application/order-importer.js';
import { SYNC_PORTS } from './application/ports/sync.ports.js';
import { ShopPager } from './application/shop-pager.js';
import { ShopSync } from './application/shop-sync.js';
import { HttpGeoReference } from './infrastructure/http-geo-reference.js';
import { PrismaImportLedger } from './infrastructure/prisma-import-ledger.js';
import { PrismaSyncClaims } from './infrastructure/prisma-sync-claims.js';
import { ShopSyncWorker } from './infrastructure/shop-sync.worker.js';

/** Shop orders in: polling and backfill now, webhooks next, all through one importer (#47). */
@Module({
  imports: [ConnectionsModule],
  providers: [
    LocationResolver,
    OrderImporter,
    ShopPager,
    ShopSync,
    ShopSyncWorker,
    { provide: SYNC_PORTS.geo, useClass: HttpGeoReference },
    { provide: SYNC_PORTS.ledger, useClass: PrismaImportLedger },
    { provide: SYNC_PORTS.claims, useClass: PrismaSyncClaims },
  ],
  exports: [OrderImporter],
})
export class SyncModule {}
