import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { DueShipment, ShipmentPollQueue } from '../application/ports/poll-queue.js';

/** One statement claims and leases: a replica that crashes mid-poll leaves the lease to expire. */
@Injectable()
export class PrismaShipmentPollQueue implements ShipmentPollQueue {
  constructor(private readonly prisma: PrismaService) {}

  claimDue(input: { limit: number; leaseMs: number }): Promise<DueShipment[]> {
    return this.prisma.$queryRaw<DueShipment[]>`
      UPDATE shipments SET next_poll_at = now() + ${input.leaseMs} * interval '1 millisecond'
      WHERE id IN (
        SELECT id FROM shipments
        WHERE next_poll_at <= now()
        ORDER BY next_poll_at
        LIMIT ${input.limit}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, store_id AS "storeId", carrier, tracking_number AS "trackingNumber"`;
  }

  async postpone(shipmentId: string, delayMs: number): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE shipments SET next_poll_at = now() + ${delayMs} * interval '1 millisecond'
      WHERE id = ${shipmentId}::uuid`;
  }
}
