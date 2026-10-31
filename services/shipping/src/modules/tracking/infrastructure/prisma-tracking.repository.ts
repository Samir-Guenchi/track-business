import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type {
  Decide,
  IngestDecision,
  IngestInput,
  ShipmentTimeline,
  TrackingRepository,
} from '../application/ports/tracking.repository.js';
import { TrackingConflictError } from '../domain/tracking.errors.js';
import { NEWEST_EVENTS_FIRST, toEvent, toShipment, toTimeline } from './tracking-rows.js';

type Tx = Prisma.TransactionClient;

@Injectable()
export class PrismaTrackingRepository implements TrackingRepository {
  constructor(private readonly prisma: PrismaService) {}

  ingest(input: IngestInput, decide: Decide): Promise<IngestDecision | null> {
    return this.prisma.$transaction(async (tx) => {
      const { carrier, trackingNumber } = input;
      const row = await tx.shipment.findUnique({
        where: { carrier_trackingNumber: { carrier, trackingNumber } },
      });
      if (!row) return null;
      const shipment = toShipment(row);
      const fresh = await this.insertNew(tx, { shipmentId: row.id, storeId: row.storeId }, input);
      const decision = decide(shipment, fresh.map(toEvent));
      const { count } = await tx.shipment.updateMany({
        where: { id: row.id, version: row.version },
        data: {
          status: decision.plan.status,
          lastEventAt: decision.plan.lastEventAt,
          nextPollAt: decision.nextPollAt,
          version: { increment: 1 },
        },
      });
      if (count !== 1) throw new TrackingConflictError('Shipment changed meanwhile');
      await this.writeOutbox(tx, decision.outbox);
      return decision;
    });
  }

  async forOrder(storeId: string, orderId: string): Promise<ShipmentTimeline[]> {
    const rows = await this.prisma.shipment.findMany({
      where: { storeId, orderId },
      include: NEWEST_EVENTS_FIRST,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toTimeline);
  }

  async byPublicCode(publicCode: string): Promise<ShipmentTimeline | null> {
    const row = await this.prisma.shipment.findUnique({
      where: { publicCode },
      include: NEWEST_EVENTS_FIRST,
    });
    return row ? toTimeline(row) : null;
  }

  /** The unique (shipment, key) index drops events already stored; only new rows come back. */
  private insertNew(tx: Tx, owner: { shipmentId: string; storeId: string }, input: IngestInput) {
    const data = input.events.map(({ key, ...event }) => ({
      ...owner,
      ...event,
      id: randomUUID(),
      dedupeKey: key,
    }));
    return tx.trackingEvent.createManyAndReturn({ data, skipDuplicates: true });
  }

  private async writeOutbox(tx: Tx, outbox: IngestDecision['outbox']): Promise<void> {
    if (outbox.length === 0) return;
    await tx.outboxEvent.createMany({
      data: outbox.map((message) => ({
        ...message,
        payload: message.payload as Prisma.InputJsonValue,
      })),
    });
  }
}
