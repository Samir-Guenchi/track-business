import { z } from 'zod';
import { DinarsSchema } from '../orders/order.schema.js';

/**
 * Live selling (#199): the seller shows short product codes on screen (A1, B2...) and viewers
 * comment the code, a size and their phone. Comments become one reservation per phone and code.
 */
export const LiveCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z][0-9]{1,2}$/);

export const LiveProductSchema = z.strictObject({
  code: LiveCodeSchema,
  name: z.string().trim().min(1).max(120),
  unitPrice: DinarsSchema,
});
export type LiveProduct = z.infer<typeof LiveProductSchema>;

/** `POST /live-sessions`. */
export const CreateLiveSessionSchema = z
  .strictObject({
    title: z.string().trim().min(1).max(80),
    products: z.array(LiveProductSchema).min(1).max(50),
  })
  .refine((body) => new Set(body.products.map((p) => p.code)).size === body.products.length, {
    message: 'Each product code is used once',
    path: ['products'],
  });
export type CreateLiveSession = z.infer<typeof CreateLiveSessionSchema>;

export const LiveReservationSchema = z.strictObject({
  id: z.uuid(),
  /** E.164, e.g. +213555123456. */
  phone: z.string(),
  name: z.string().nullable(),
  code: z.string(),
  size: z.string().nullable(),
  quantity: z.number().int().min(1),
  /** The comment it was read from. */
  comment: z.string(),
  createdAt: z.iso.datetime(),
  /** The order created from it, once the seller did. */
  orderId: z.string().nullable(),
});
export type LiveReservation = z.infer<typeof LiveReservationSchema>;

export const LiveSessionSchema = z.strictObject({
  id: z.uuid(),
  title: z.string(),
  createdAt: z.iso.datetime(),
  products: z.array(LiveProductSchema),
  reservations: z.array(LiveReservationSchema),
});
export type LiveSession = z.infer<typeof LiveSessionSchema>;

/** `GET /live-sessions`: newest first. */
export const ListLiveSessionsResponseSchema = z.strictObject({
  items: z.array(
    z.strictObject({
      id: z.uuid(),
      title: z.string(),
      createdAt: z.iso.datetime(),
      reservations: z.number().int().min(0),
      ordered: z.number().int().min(0),
    }),
  ),
});
export type ListLiveSessionsResponse = z.infer<typeof ListLiveSessionsResponseSchema>;

/** `POST /live-sessions/:id/comments`: pasted or exported comments, one per line. */
export const AddLiveCommentsSchema = z.strictObject({
  text: z.string().min(1).max(50_000),
});
export type AddLiveComments = z.infer<typeof AddLiveCommentsSchema>;

export const AddLiveCommentsResponseSchema = z.strictObject({
  added: z.number().int().min(0),
  /** Same phone and code as a reservation already in the session. */
  duplicates: z.number().int().min(0),
  /** Comments with a code but no phone, or a phone but no known code (first 50). */
  unread: z.array(z.string()).max(50),
  session: LiveSessionSchema,
});
export type AddLiveCommentsResponse = z.infer<typeof AddLiveCommentsResponseSchema>;

/** `PATCH /live-sessions/:id/reservations/:reservationId`: the order made from it. */
export const LinkLiveOrderSchema = z.strictObject({ orderId: z.string().min(1).max(64) });
export type LinkLiveOrder = z.infer<typeof LinkLiveOrderSchema>;
