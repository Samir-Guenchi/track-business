import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { RouteQuery, TransitSamples } from '../application/transit-samples.port.js';
import type { TransitSample } from '../domain/eta.js';

/** Enough for stable quantiles; the newest parcels reflect the carrier today. */
const MAX_SAMPLES = 500;

/**
 * Transit times are pooled across stores: they describe the carrier, not the store, and only
 * dates leave this query (no store, order or customer). Hand-over is the first pick-up or
 * in-transit scan, else the parcel's creation.
 */
@Injectable()
export class PrismaTransitSamples implements TransitSamples {
  constructor(private readonly prisma: PrismaService) {}

  forRoute(query: RouteQuery): Promise<TransitSample[]> {
    return this.prisma.$queryRaw<TransitSample[]>`
      SELECT COALESCE(
          (SELECT min(e.at) FROM tracking_events e
            WHERE e.shipment_id = s.id AND e.status IN ('picked_up', 'in_transit')),
          s.created_at) AS "startedAt",
        s.last_event_at AS "deliveredAt"
      FROM shipments s
      WHERE s.carrier = ${query.carrier} AND s.to_wilaya_code = ${query.wilayaCode}
        AND s.status = 'delivered' AND s.last_event_at IS NOT NULL
        AND s.created_at > ${query.since}
      ORDER BY s.created_at DESC
      LIMIT ${MAX_SAMPLES}`;
  }
}
