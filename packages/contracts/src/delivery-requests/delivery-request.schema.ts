import { z } from 'zod';

/**
 * What a customer can ask from the tracking link before the courier leaves (#136), as DPD Predict
 * or UPS My Choice do: another day, a stop-desk instead, a fixed address, or "call me after".
 */
export const DeliveryRequestKindSchema = z.enum([
  'reschedule',
  'switch_stopdesk',
  'fix_address',
  'call_after',
]);
export type DeliveryRequestKind = z.infer<typeof DeliveryRequestKindSchema>;

export const DELIVERY_REQUEST_LIMITS = {
  /** Requests one parcel accepts per rolling 24 hours, so a shared link cannot flood the seller. */
  perDay: 3,
  /** Furthest day a customer can push the delivery to, counted from tomorrow. */
  maxDaysAhead: 7,
} as const;

const TimeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const CreateDeliveryRequestSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('reschedule'), date: z.iso.date() }),
  z.strictObject({ kind: z.literal('switch_stopdesk') }),
  z.strictObject({
    kind: z.literal('fix_address'),
    address: z.string().trim().min(5).max(200),
    landmark: z.string().trim().min(2).max(160).optional(),
  }),
  z.strictObject({ kind: z.literal('call_after'), time: TimeOfDaySchema }),
]);
export type CreateDeliveryRequest = z.infer<typeof CreateDeliveryRequestSchema>;

/** pending: the seller has not acted; sent: passed to the carrier; dismissed: not applied. */
export const DeliveryRequestStateSchema = z.enum(['pending', 'sent', 'dismissed']);
export type DeliveryRequestState = z.infer<typeof DeliveryRequestStateSchema>;

/** What the customer sees of their own requests: no seller or carrier detail. */
export const PublicDeliveryRequestSchema = z.strictObject({
  request: CreateDeliveryRequestSchema,
  state: DeliveryRequestStateSchema,
  createdAt: z.iso.datetime(),
});
export type PublicDeliveryRequest = z.infer<typeof PublicDeliveryRequestSchema>;

/** `GET /public/tracking/:code/choices`: what this parcel still allows, and what it costs. */
export const DeliveryChoicesSchema = z.strictObject({
  kinds: z.array(DeliveryRequestKindSchema),
  /** Change to the amount due when switching to a stop-desk; negative is cheaper. */
  stopDeskFeeDelta: z.number().int().nullable(),
  earliestDate: z.iso.date(),
  latestDate: z.iso.date(),
  remainingToday: z.number().int().min(0),
  requests: z.array(PublicDeliveryRequestSchema),
});
export type DeliveryChoices = z.infer<typeof DeliveryChoicesSchema>;
