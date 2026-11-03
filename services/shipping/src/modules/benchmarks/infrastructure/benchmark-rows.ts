import type { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { BenchmarkRow } from '../domain/benchmark.js';

const DAYS = `extract(epoch FROM s.last_event_at - s.created_at) / 86400`;

/**
 * Final parcels of the last `days` days per wilaya and per carrier to a wilaya, split into this
 * store and all other stores (#200). Only counts leave the database, never another store's id.
 */
export function benchmarkRows(prisma: PrismaService, storeId: string, days: number) {
  return prisma.$queryRawUnsafe<BenchmarkRow[]>(
    `SELECT CASE WHEN GROUPING(s.carrier) = 1 THEN NULL ELSE s.carrier END AS carrier,
      s.to_wilaya_code AS "wilayaCode",
      count(*) FILTER (WHERE own AND s.status = 'delivered')::int AS "ownDelivered",
      count(*) FILTER (WHERE own AND s.status = 'returned')::int AS "ownReturned",
      coalesce(sum(${DAYS}) FILTER (WHERE own AND s.status = 'delivered'), 0)::float8 AS "ownDays",
      count(DISTINCT s.store_id) FILTER (WHERE NOT own)::int AS "otherStores",
      count(*) FILTER (WHERE NOT own AND s.status = 'delivered')::int AS "otherDelivered",
      count(*) FILTER (WHERE NOT own AND s.status = 'returned')::int AS "otherReturned",
      coalesce(sum(${DAYS}) FILTER (WHERE NOT own AND s.status = 'delivered'), 0)::float8
        AS "otherDays"
    FROM (SELECT *, store_id = $1::uuid AS own FROM shipments) s
    WHERE s.status IN ('delivered', 'returned')
      AND s.created_at > now() - make_interval(days => $2::int)
    GROUP BY GROUPING SETS ((s.to_wilaya_code), (s.carrier, s.to_wilaya_code))`,
    storeId,
    days,
  );
}
