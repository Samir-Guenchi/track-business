import type { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { ScoreRow } from '../domain/scorecard.js';

/** This store's parcels of the last `days` days, per carrier and destination (#139). */
export function scoreRows(prisma: PrismaService, storeId: string, days: number) {
  return prisma.$queryRaw<ScoreRow[]>`
    SELECT s.carrier, s.to_wilaya_code AS "wilayaCode",
      count(*)::int AS parcels,
      count(*) FILTER (WHERE s.status = 'delivered')::int AS delivered,
      count(*) FILTER (WHERE s.status = 'returned')::int AS returned,
      coalesce(sum(extract(epoch FROM s.last_event_at - s.created_at) / 86400)
        FILTER (WHERE s.status = 'delivered'), 0)::float8 AS "deliveryDays",
      count(*) FILTER (WHERE r.condition IN ('damaged', 'incomplete'))::int AS damaged,
      count(*) FILTER (WHERE c.reason IN ('lost', 'return_missing'))::int AS lost,
      count(c.id)::int AS claims,
      count(*) FILTER (WHERE c.state = 'won')::int AS "claimsWon",
      coalesce(sum(c.recovered), 0)::int AS recovered
    FROM shipments s
      LEFT JOIN return_receipts r ON r.shipment_id = s.id
      LEFT JOIN claims c ON c.shipment_id = s.id
    WHERE s.store_id = ${storeId}::uuid AND s.status <> 'cancelled'
      AND s.created_at > now() - make_interval(days => ${days}::int)
    GROUP BY s.carrier, s.to_wilaya_code`;
}
