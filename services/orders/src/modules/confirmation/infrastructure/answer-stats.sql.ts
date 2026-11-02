import { UNREACHED_OUTCOMES } from '@trackecom/contracts';
import { Prisma } from '../../../generated/prisma/client.js';
import type { AnswerStatsQuery } from '../application/ports/confirmation.repository.js';

/**
 * Calls per Algiers hour and how many reached someone, for the store's call history, narrowed to
 * one customer (phone) or one wilaya. Uses the (store_id, agent_id, at) index range on `at`.
 */
export function answerStatsSql(query: AnswerStatsQuery): Prisma.Sql {
  const unreached = [...UNREACHED_OUTCOMES];
  const phone =
    query.phone === undefined ? Prisma.empty : Prisma.sql`AND o.customer_phone = ${query.phone}`;
  const wilaya =
    query.wilayaCode === undefined
      ? Prisma.empty
      : Prisma.sql`AND o.wilaya_code = ${query.wilayaCode}`;
  return Prisma.sql`
    SELECT EXTRACT(HOUR FROM a.at AT TIME ZONE 'Africa/Algiers')::int AS hour,
      COUNT(*)::int AS attempts,
      COUNT(*) FILTER (WHERE a.outcome <> ALL(${unreached}::text[]))::int AS answered
    FROM call_attempts a
    JOIN orders o ON o.id = a.order_id AND o.store_id = a.store_id
    WHERE a.store_id = ${query.storeId}::uuid AND a.at >= ${query.since} ${phone} ${wilaya}
    GROUP BY 1`;
}
