import { z } from 'zod';
import { CustomerInputSchema } from '../orders/customer.schema.js';
import { DeliveryTypeSchema, DinarsSchema } from '../orders/order.schema.js';
import {
  ResellerOrderSchema,
  ResellerProductSchema,
  ResellerStatsSchema,
} from './reseller.schema.js';

/** Portal link codes: random, not guessable, like tracking codes. */
export const PortalCodeSchema = z.string().regex(/^[A-Za-z0-9_-]{16,32}$/);

/** Orders a reseller can send in one day, so a leaked link cannot flood the supplier. */
export const RESELLER_DAILY_ORDERS = 50;

/** `GET /public/resellers/:code`: the reseller's own portal. */
export const ResellerPortalSchema = z.strictObject({
  name: z.string(),
  active: z.boolean(),
  catalogue: z.array(ResellerProductSchema),
  stats: ResellerStatsSchema,
  /** Only this reseller's orders, newest first. */
  orders: z.array(ResellerOrderSchema),
});
export type ResellerPortal = z.infer<typeof ResellerPortalSchema>;

export const ResellerOrderItemSchema = z.strictObject({
  productId: z.uuid(),
  quantity: z.number().int().min(1).max(99),
  /** What the customer pays per unit; the margin is this minus the supplier price. */
  sellingPrice: DinarsSchema,
});

/** `POST /public/resellers/:code/orders`: the reseller sends a customer's order. */
export const ResellerOrderRequestSchema = z
  .strictObject({
    customer: CustomerInputSchema,
    items: z.array(ResellerOrderItemSchema).min(1).max(10),
    deliveryType: DeliveryTypeSchema,
    stopDeskId: z.string().min(1).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .refine(
    (order) =>
      order.deliveryType === 'home' ? Boolean(order.customer.address) : Boolean(order.stopDeskId),
    { message: 'Home delivery needs an address; stop-desk delivery needs a stopDeskId' },
  );
export type ResellerOrderRequest = z.input<typeof ResellerOrderRequestSchema>;

export const ResellerOrderCreatedSchema = z.strictObject({
  ref: z.string(),
  codAmount: z.number().int(),
  margin: z.number().int(),
  /** null when the delivery price could not be read: the supplier confirms it on the call. */
  shippingFee: z.number().int().nullable(),
});
export type ResellerOrderCreated = z.infer<typeof ResellerOrderCreatedSchema>;
