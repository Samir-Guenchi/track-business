import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { ConnectionRecord } from '../../connections/application/ports/connection.repository.js';
import {
  PUBLIC_FIELDS,
  toConnection,
} from '../../connections/infrastructure/prisma-connection.repository.js';
import type { SyncClaims } from '../application/ports/sync.ports.js';

/**
 * Leases a due shop by stamping `last_sync_at` in the same statement that picks it (SKIP
 * LOCKED), so two replicas never poll one shop at once. A crash mid-sync just waits one interval.
 */
@Injectable()
export class PrismaSyncClaims implements SyncClaims {
  constructor(private readonly prisma: PrismaService) {}

  async claimDue(now: Date, staleBefore: Date): Promise<ConnectionRecord | null> {
    const [claimed] = await this.prisma.$queryRaw<{ id: string }[]>`
      UPDATE shop_connections SET last_sync_at = ${now}
      WHERE id = (
        SELECT id FROM shop_connections
        WHERE status <> 'needs_reconnect'
          AND (last_sync_at IS NULL OR last_sync_at < ${staleBefore})
        ORDER BY last_sync_at ASC NULLS FIRST
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id`;
    if (!claimed) return null;
    const row = await this.prisma.shopConnection.findUnique({
      where: { id: claimed.id },
      select: PUBLIC_FIELDS,
    });
    return row ? toConnection(row) : null;
  }

  async succeeded(
    connection: ConnectionRecord,
    result: { syncedThrough: Date; syncedAt: Date },
  ): Promise<void> {
    await this.prisma.shopConnection.updateMany({
      where: { id: connection.id },
      data: {
        syncedThrough: result.syncedThrough,
        lastSyncAt: result.syncedAt,
        status: 'connected',
        lastError: null,
      },
    });
  }

  async failed(
    connection: ConnectionRecord,
    failure: { reconnect: boolean; error: string },
  ): Promise<void> {
    await this.prisma.shopConnection.updateMany({
      where: { id: connection.id },
      data: { status: failure.reconnect ? 'needs_reconnect' : 'error', lastError: failure.error },
    });
  }
}
