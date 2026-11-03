import { z } from 'zod';
import { AlgerianPhoneSchema } from '../common/phone.schema.js';
import { DinarsSchema } from '../orders/order.schema.js';
import { OrderStatusSchema } from '../orders/order-status.js';

/**
 * Resellers and affiliates (#198): people who find customers on Facebook or TikTok and sell a
 * supplier store's products with their own margin. The supplier keeps the stock, confirms and
 * ships; the reseller's margin is owed only once the order is delivered.
 */
export const ResellerInputSchema = z.strictObject({
  name: z.string().trim().min(2).max(80),
  phone: AlgerianPhoneSchema,
  /** A paused reseller keeps their history but cannot send new orders. */
  active: z.boolean().default(true),
});
export type ResellerInput = z.input<typeof ResellerInputSchema>;

/** pending: on its way; earned: delivered, not paid yet; paid; void: cancelled or returned. */
export const MarginStateSchema = z.enum(['pending', 'earned', 'paid', 'void']);
export type MarginState = z.infer<typeof MarginStateSchema>;

export const ResellerStatsSchema = z.strictObject({
  orders: z.number().int().min(0),
  delivered: z.number().int().min(0),
  returned: z.number().int().min(0),
  /** delivered / (delivered + returned); null before the first final order. */
  deliveryRate: z.number().min(0).max(1).nullable(),
  marginPending: z.number().int().min(0),
  marginEarned: z.number().int().min(0),
  marginPaid: z.number().int().min(0),
});
export type ResellerStats = z.infer<typeof ResellerStatsSchema>;

export const ResellerSchema = z.strictObject({
  id: z.uuid(),
  name: z.string(),
  phone: z.string(),
  active: z.boolean(),
  /** Secret code of the reseller's portal link `/r/<portalCode>`. */
  portalCode: z.string(),
  stats: ResellerStatsSchema,
});
export type Reseller = z.infer<typeof ResellerSchema>;

export const ListResellersResponseSchema = z.strictObject({ items: z.array(ResellerSchema) });
export type ListResellersResponse = z.infer<typeof ListResellersResponseSchema>;

/** A product the supplier offers to resellers, at the supplier price. */
export const ResellerProductInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(120),
  supplierPrice: DinarsSchema,
  /** Lowest selling price allowed, so resellers do not undercut the supplier's own shop. */
  minPrice: DinarsSchema.optional(),
  active: z.boolean().default(true),
});
export type ResellerProductInput = z.input<typeof ResellerProductInputSchema>;

export const ResellerProductSchema = z.strictObject({
  id: z.uuid(),
  name: z.string(),
  supplierPrice: z.number().int(),
  minPrice: z.number().int().nullable(),
  active: z.boolean(),
});
export type ResellerProduct = z.infer<typeof ResellerProductSchema>;

export const ResellerCatalogueSchema = z.strictObject({ items: z.array(ResellerProductSchema) });
export type ResellerCatalogue = z.infer<typeof ResellerCatalogueSchema>;

/** One reseller order as the supplier and the reseller see it. */
export const ResellerOrderSchema = z.strictObject({
  orderId: z.uuid(),
  ref: z.string(),
  customerName: z.string(),
  wilayaCode: z.number().int(),
  status: OrderStatusSchema,
  codAmount: z.number().int(),
  margin: z.number().int(),
  marginState: MarginStateSchema,
  createdAt: z.iso.datetime(),
});
export type ResellerOrder = z.infer<typeof ResellerOrderSchema>;

export const ListResellerOrdersResponseSchema = z.strictObject({
  items: z.array(ResellerOrderSchema),
});
export type ListResellerOrdersResponse = z.infer<typeof ListResellerOrdersResponseSchema>;

/** `POST /resellers/:id/payout`: the earned margins the supplier just paid. */
export const ResellerPayoutResponseSchema = z.strictObject({
  orders: z.number().int().min(0),
  amount: z.number().int().min(0),
});
export type ResellerPayoutResponse = z.infer<typeof ResellerPayoutResponseSchema>;
