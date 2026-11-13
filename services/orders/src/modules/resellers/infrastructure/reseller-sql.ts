import { type ResellerStats, OrderStatusSchema, type ResellerOrder } from '@trackecom/contracts';
import { Prisma } from '../../../generated/prisma/client.js';
import { deliveryRate, marginState, VOID_STATUSES } from '../domain/reseller-margin.js';

export interface StatsRow {
  readonly resellerId: string;
  readonly orders: number;
  readonly delivered: number;
  readonly returned: number;
  readonly pending: number;
  readonly earned: number;
  readonly paid: number;
}

const FINAL = [...VOID_STATUSES, 'delivered'];

/** Counts and margins per reseller of a store, optionally one reseller. */
export const statsSql = (storeId: string, resellerId?: string) => Prisma.sql`
  SELECT ro.reseller_id AS "resellerId",
    count(*)::int AS orders,
    (count(*) FILTER (WHERE o.status = 'delivered'))::int AS delivered,
    (count(*) FILTER (WHERE o.status IN ('returning', 'returned')))::int AS returned,
    coalesce(sum(ro.margin) FILTER (WHERE ro.paid_at IS NULL AND o.status <> ALL(${FINAL})), 0)::int
      AS pending,
    coalesce(sum(ro.margin) FILTER (WHERE ro.paid_at IS NULL AND o.status = 'delivered'), 0)::int
      AS earned,
    coalesce(sum(ro.margin) FILTER (WHERE ro.paid_at IS NOT NULL), 0)::int AS paid
  FROM reseller_orders ro JOIN orders o ON o.id = ro.order_id
  WHERE ro.store_id = ${storeId}::uuid
    ${resellerId ? Prisma.sql`AND ro.reseller_id = ${resellerId}::uuid` : Prisma.empty}
  GROUP BY ro.reseller_id`;

const EMPTY: StatsRow = {
  resellerId: '',
  orders: 0,
  delivered: 0,
  returned: 0,
  pending: 0,
  earned: 0,
  paid: 0,
};

export function toStats(found: StatsRow | undefined): ResellerStats {
  const row = found ?? EMPTY;
  return {
    orders: row.orders,
    delivered: row.delivered,
    returned: row.returned,
    deliveryRate: deliveryRate(row.delivered, row.returned),
    marginPending: row.pending,
    marginEarned: row.earned,
    marginPaid: row.paid,
  };
}

export interface OrderRow {
  readonly orderId: string;
  readonly ref: string;
  readonly customerName: string;
  readonly wilayaCode: number;
  readonly status: string;
  readonly codAmount: number;
  readonly margin: number;
  readonly paidAt: Date | null;
  readonly createdAt: Date;
}

export const ordersSql = (storeId: string, resellerId: string) => Prisma.sql`
  SELECT ro.order_id AS "orderId", o.ref, o.customer_name AS "customerName",
    o.wilaya_code AS "wilayaCode", o.status, o.cod_amount AS "codAmount", ro.margin,
    ro.paid_at AS "paidAt", ro.created_at AS "createdAt"
  FROM reseller_orders ro JOIN orders o ON o.id = ro.order_id
  WHERE ro.store_id = ${storeId}::uuid AND ro.reseller_id = ${resellerId}::uuid
  ORDER BY ro.created_at DESC
  LIMIT 200`;

export function toOrder(row: OrderRow): ResellerOrder {
  const status = OrderStatusSchema.parse(row.status);
  return {
    orderId: row.orderId,
    ref: row.ref,
    customerName: row.customerName,
    wilayaCode: row.wilayaCode,
    status,
    codAmount: row.codAmount,
    margin: row.margin,
    marginState: marginState(status, row.paidAt),
    createdAt: row.createdAt.toISOString(),
  };
}

/** Pays every delivered, unpaid margin of a reseller at once. */
export const payoutSql = (storeId: string, resellerId: string) => Prisma.sql`
  UPDATE reseller_orders ro SET paid_at = now()
  FROM orders o
  WHERE o.id = ro.order_id AND o.status = 'delivered' AND ro.paid_at IS NULL
    AND ro.store_id = ${storeId}::uuid AND ro.reseller_id = ${resellerId}::uuid
  RETURNING ro.margin`;
