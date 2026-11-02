import { Prisma } from '../../../generated/prisma/client.js';
import type { ClaimRequest } from '../application/ports/confirmation.repository.js';

/**
 * One statement picks and locks the next order. `FOR UPDATE SKIP LOCKED` makes concurrent agents
 * skip the row another transaction is claiming, so two agents never get the same order.
 * Priority: the order the agent already holds, then due call-backs / postponed orders (earliest
 * first), then the oldest order.
 */
export function claimNextSql(claim: ClaimRequest): Prisma.Sql {
  const { storeId, agentId, now, lockUntil, day, maxPerDay } = claim;
  const wilayas = [...claim.wilayaCodes];
  const products = [...claim.productIds];
  return Prisma.sql`
    UPDATE orders SET locked_by = ${agentId}::uuid, locked_until = ${lockUntil}
    WHERE id = (
      SELECT o.id FROM orders o
      WHERE o.store_id = ${storeId}::uuid
        AND o.deleted_at IS NULL
        AND o.status IN ('new', 'to_confirm', 'postponed')
        AND COALESCE(o.next_call_at, o.postponed_until, ${now}) <= ${now}
        AND (o.locked_until IS NULL OR o.locked_until <= ${now} OR o.locked_by = ${agentId}::uuid)
        AND (o.last_call_day IS DISTINCT FROM ${day} OR o.calls_today < ${maxPerDay})
        AND (cardinality(${wilayas}::int[]) = 0 OR o.wilaya_code = ANY(${wilayas}::int[]))
        AND (cardinality(${products}::text[]) = 0 OR EXISTS (
          SELECT 1 FROM order_items i WHERE i.order_id = o.id AND i.product_id = ANY(${products}::text[])
        ))
      ORDER BY (o.locked_by = ${agentId}::uuid AND o.locked_until > ${now}) IS TRUE DESC,
        COALESCE(o.next_call_at, o.postponed_until) ASC NULLS LAST,
        o.created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id`;
}
