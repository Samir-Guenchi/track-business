import type { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';

export interface CarrierStats {
  readonly carrier: string;
  readonly delivered: number;
  readonly returned: number;
  readonly avgDays: number | null;
}

/** Only parcels from the last 90 days count: carriers improve and degrade. */
const WINDOW = '90 days';
/** Network rates are shown only above these, so no single store can be recognised. */
export const NETWORK_MIN_STORES = 3;
export const NETWORK_MIN_PARCELS = 20;

interface StatsQuery {
  readonly wilayaCode: number;
  readonly carriers: readonly string[];
}

/** This store's delivered and returned parcels per carrier to one wilaya. */
export function storeStats(prisma: PrismaService, query: StatsQuery & { storeId: string }) {
  return prisma.$queryRaw<CarrierStats[]>`
    SELECT carrier,
      count(*) FILTER (WHERE status = 'delivered')::int AS delivered,
      count(*) FILTER (WHERE status = 'returned')::int AS returned,
      (avg(extract(epoch FROM last_event_at - created_at)) FILTER (WHERE status = 'delivered')
        / 86400)::float8 AS "avgDays"
    FROM shipments
    WHERE store_id = ${query.storeId}::uuid AND to_wilaya_code = ${query.wilayaCode}
      AND status IN ('delivered', 'returned') AND carrier = ANY(${[...query.carriers]})
      AND created_at > now() - ${WINDOW}::interval
    GROUP BY carrier`;
}

/** The same across every store, anonymised: only carriers with enough stores and parcels. */
export function networkStats(prisma: PrismaService, query: StatsQuery) {
  return prisma.$queryRaw<CarrierStats[]>`
    SELECT carrier,
      count(*) FILTER (WHERE status = 'delivered')::int AS delivered,
      count(*) FILTER (WHERE status = 'returned')::int AS returned,
      (avg(extract(epoch FROM last_event_at - created_at)) FILTER (WHERE status = 'delivered')
        / 86400)::float8 AS "avgDays"
    FROM shipments
    WHERE to_wilaya_code = ${query.wilayaCode} AND status IN ('delivered', 'returned')
      AND carrier = ANY(${[...query.carriers]}) AND created_at > now() - ${WINDOW}::interval
    GROUP BY carrier
    HAVING count(DISTINCT store_id) >= ${NETWORK_MIN_STORES}
      AND count(*) >= ${NETWORK_MIN_PARCELS}`;
}
