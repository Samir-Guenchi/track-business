import { z } from 'zod';
import { DinarsSchema } from './order.schema.js';

/** One item of the delivered order swapped for another size, colour or product (#138). */
export const ExchangeLineSchema = z.strictObject({
  /** The item of the original order that comes back. */
  itemId: z.string().min(1),
  quantity: z.number().int().min(1).max(999),
  /** What goes out instead, e.g. "Robe fleurie - taille L". */
  replacement: z.string().trim().min(1).max(120),
  /** Extra the customer pays per unit when the new item costs more; 0 for a plain swap. */
  priceDifference: DinarsSchema.default(0),
});
export type ExchangeLine = z.infer<typeof ExchangeLineSchema>;

/** `POST /orders/:id/exchange`: one new order the courier delivers while taking the old items. */
export const CreateExchangeRequestSchema = z.strictObject({
  lines: z.array(ExchangeLineSchema).min(1).max(20),
  /** The customer pays the new trip (added to the amount to collect), or the store absorbs it. */
  deliveryPaidBy: z.enum(['customer', 'store']),
  shippingFee: DinarsSchema,
  notes: z.string().trim().max(1000).optional(),
});
export type CreateExchangeRequest = z.input<typeof CreateExchangeRequestSchema>;
