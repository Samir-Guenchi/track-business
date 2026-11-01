import { z } from 'zod';
import { DeliveryTypeSchema } from '../orders/order.schema.js';
import { OrderStatusSchema } from '../orders/order-status.js';

/** How long a self-confirmation link works (#54). */
export const SELF_CONFIRM_LINK_HOURS = 72;

/** `POST /orders/:id/confirmation-link` (orders.confirm): a one-time link for the customer. */
export const ConfirmationLinkSchema = z.strictObject({
  url: z.url(),
  expiresAt: z.iso.datetime(),
});
export type ConfirmationLink = z.infer<typeof ConfirmationLinkSchema>;

/**
 * `GET /public/confirm/:token`: what the customer sees. Only their own order, no phone number,
 * and nothing about the store's other data.
 */
export const SelfConfirmViewSchema = z.strictObject({
  ref: z.string(),
  status: OrderStatusSchema,
  items: z.array(z.strictObject({ name: z.string(), quantity: z.number().int() })),
  codAmount: z.number().int(),
  deliveryType: DeliveryTypeSchema,
  wilayaCode: z.number().int(),
  communeId: z.number().int(),
  address: z.string().nullable(),
  /** False once the link was used or the order moved past confirmation. */
  canAnswer: z.boolean(),
  expiresAt: z.iso.datetime(),
});
export type SelfConfirmView = z.infer<typeof SelfConfirmViewSchema>;

/** `POST /public/confirm/:token`: confirm, cancel, or fix the address and confirm. */
export const SelfConfirmRequestSchema = z.discriminatedUnion('action', [
  z.strictObject({ action: z.literal('confirm') }),
  z.strictObject({ action: z.literal('cancel'), reason: z.string().trim().max(200).optional() }),
  z.strictObject({
    action: z.literal('change_address'),
    wilayaCode: z.number().int().min(1).max(99),
    communeId: z.number().int().positive(),
    address: z.string().trim().min(3).max(255),
  }),
]);
export type SelfConfirmRequest = z.infer<typeof SelfConfirmRequestSchema>;

export const SelfConfirmResponseSchema = z.strictObject({ status: OrderStatusSchema });
export type SelfConfirmResponse = z.infer<typeof SelfConfirmResponseSchema>;
