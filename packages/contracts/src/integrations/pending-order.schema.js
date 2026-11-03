import { z } from 'zod';
import { AlgerianPhoneSchema } from '../common/phone.schema.js';
/** Why a shop order waits for the seller instead of becoming an order. */
export const IMPORT_PROBLEMS = ['currency', 'phone', 'address', 'invalid'];
export const ImportProblemSchema = z.enum(IMPORT_PROBLEMS);
/** `GET /integrations/orders/needs-fix`: shop orders held back, with what the shop sent. */
export const PendingShopOrderSchema = z.strictObject({
  connectionId: z.uuid(),
  externalId: z.string(),
  externalName: z.string(),
  problem: ImportProblemSchema,
  customer: z.strictObject({
    name: z.string(),
    phone: z.string().nullable(),
    address: z.string().nullable(),
    city: z.string().nullable(),
    province: z.string().nullable(),
  }),
  total: z.number().int(),
  currency: z.string(),
  receivedAt: z.iso.datetime(),
});
export const PendingShopOrdersResponseSchema = z.strictObject({
  items: z.array(PendingShopOrderSchema),
});
const pendingKey = { connectionId: z.uuid(), externalId: z.string().min(1).max(100) };
/**
 * `POST /integrations/orders/needs-fix/resolve`: the seller places the customer, and may correct
 * the phone and street address; the order is then sent like any other shop order.
 */
export const ResolvePendingOrderRequestSchema = z.strictObject({
  ...pendingKey,
  phone: AlgerianPhoneSchema.optional(),
  wilayaCode: z.number().int().min(1).max(99),
  communeId: z.number().int().positive(),
  address: z.string().trim().min(1).max(255).optional(),
});
/** `POST /integrations/orders/needs-fix/skip`: the seller decides it is not a real order. */
export const SkipPendingOrderRequestSchema = z.strictObject(pendingKey);
