import { Inject, Injectable } from '@nestjs/common';
import { ConnectorError } from '@trackecom/connectors';
import type { LoopTask } from '@trackecom/events';
import { type Env, ENV } from '../../../config/env.schema.js';
import { SYNC_PORTS, type SyncClaims } from './ports/sync.ports.js';
import { ShopPager } from './shop-pager.js';
const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

/**
 * Polls one due shop per run (#47): the last `BACKFILL_DAYS` on the first sync, then whatever
 * changed since the last one. Pages go through the importer, which drops anything already seen.
 * A refused token marks the shop `needs_reconnect`; other failures retry at the next interval.
 */
@Injectable()
export class ShopSync implements LoopTask {
  readonly name = 'shop-sync';

  constructor(
    @Inject(SYNC_PORTS.claims) private readonly claims: SyncClaims,
    private readonly pager: ShopPager,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async runOnce(): Promise<number> {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - this.env.SYNC_INTERVAL_MINUTES * MINUTE_MS);
    const connection = await this.claims.claimDue(now, staleBefore);
    if (!connection) return 0;
    try {
      const backfill = new Date(now.getTime() - this.env.BACKFILL_DAYS * DAY_MS);
      const outcome = await this.pager.pull(connection, connection.syncedThrough ?? backfill);
      const syncedAt = outcome.more ? new Date(staleBefore.getTime() - 1) : now;
      await this.claims.succeeded(connection, { syncedThrough: outcome.syncedThrough, syncedAt });
    } catch (error) {
      if (!(error instanceof ConnectorError)) throw error;
      const failure = { reconnect: error.kind === 'auth', error: `connector.${error.kind}` };
      await this.claims.failed(connection, failure);
    }
    return 1;
  }
}
