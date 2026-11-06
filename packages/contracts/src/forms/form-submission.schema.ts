import { z } from 'zod';
import { AlgerianPhoneSchema } from '../common/phone.schema.js';
import { DeliveryTypeSchema, DinarsSchema } from '../orders/order.schema.js';

/**
 * Limits a store cannot raise: they stop bots and "sabotage" orders, not real customers. A store
 * can make them stricter with FormLimits (#134).
 */
export const FORM_LIMITS = {
  /** Submissions from one network address per hour, across every form. */
  perIpPerHour: 5,
  /** Orders for one phone per hour in a store. */
  perPhonePerHour: 3,
  /** The same phone ordering the same product again within this window is a duplicate. */
  duplicateWindowHours: 24,
} as const;

const UtmValueSchema = z.string().trim().min(1).max(100);

/** Campaign parameters of the landing page, kept for ad analytics. */
export const UtmSchema = z.strictObject({
  source: UtmValueSchema.optional(),
  medium: UtmValueSchema.optional(),
  campaign: UtmValueSchema.optional(),
  content: UtmValueSchema.optional(),
  term: UtmValueSchema.optional(),
});
export type Utm = z.infer<typeof UtmSchema>;

/** `POST /public/forms/:key/orders`: what the customer typed. The store comes from the key. */
export const SubmitFormOrderRequestSchema = z
  .strictObject({
    name: z.string().trim().min(2).max(80),
    phone: AlgerianPhoneSchema,
    wilayaCode: z.number().int().min(1).max(99),
    communeId: z.number().int().positive(),
    address: z.string().trim().min(3).max(255).optional(),
    deliveryType: DeliveryTypeSchema,
    stopDeskId: z.string().trim().min(1).max(60).optional(),
    productId: z.string().min(1).max(40),
    variant: z.string().trim().min(1).max(40).optional(),
    quantity: z.number().int().min(1).max(50),
    /** Honeypot: hidden from people, so only a bot fills it in. */
    website: z.string().max(200).optional(),
    utm: UtmSchema.optional(),
  })
  .refine(
    (body) => (body.deliveryType === 'home' ? Boolean(body.address) : Boolean(body.stopDeskId)),
    {
      message: 'Home delivery needs an address; stop-desk delivery needs a stopDeskId',
      path: ['deliveryType'],
    },
  );
export type SubmitFormOrderRequest = z.output<typeof SubmitFormOrderRequestSchema>;
export type SubmitFormOrderInput = z.input<typeof SubmitFormOrderRequestSchema>;

/** What the thank-you screen shows; the seller calls to confirm. */
export const SubmitFormOrderResponseSchema = z.strictObject({
  ref: z.string(),
  subtotal: DinarsSchema,
  /** null when the price could not be checked yet: the seller confirms it on the call. */
  shippingFee: DinarsSchema.nullable(),
  total: DinarsSchema,
});
export type SubmitFormOrderResponse = z.infer<typeof SubmitFormOrderResponseSchema>;
