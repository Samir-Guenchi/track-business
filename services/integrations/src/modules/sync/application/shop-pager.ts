import { Injectable } from '@nestjs/common';
import { ConnectionsService } from '../../connections/application/connections.service.js';
import type { ConnectionRecord } from '../../connections/application/ports/connection.repository.js';
import { OrderImporter } from './order-importer.js';
import type { SyncOutcome } from './ports/sync.ports.js';

/** Bounds one run so a big backfill shares the worker with other shops. */
const MAX_PAGES = 10;

/** Reads a shop's orders changed since a date, page by page, through the importer. */
@Injectable()
export class ShopPager {
  constructor(
    private readonly connections: ConnectionsService,
    private readonly importer: OrderImporter,
  ) {}

  async pull(connection: ConnectionRecord, since: Date): Promise<SyncOutcome> {
    const { connector, ctx } = await this.connections.open(connection);
    let syncedThrough = since;
    let cursor: string | null = null;
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const result = await connector.listOrders(ctx, { since, cursor });
      await this.importer.import(connection, result.orders);
      syncedThrough = result.orders.reduce(
        (latest, order) => (order.updatedAt > latest ? order.updatedAt : latest),
        syncedThrough,
      );
      cursor = result.nextCursor;
      if (!cursor) return { syncedThrough, more: false };
    }
    return { syncedThrough, more: true };
  }
}
