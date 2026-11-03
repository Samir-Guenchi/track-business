import { z } from 'zod';
import { DeliveryTypeSchema, DinarsSchema } from '../orders/order.schema.js';
import { StorePriceSchema } from '../pricing/pricing.schema.js';
/**
 * Embeddable COD order form (#134). A seller creates a form for a landing page; customers order
 * through its public key, never through the store id, which stays private.
 */
export const FORM_KEY_LENGTH = 22;
export const FormKeySchema = z.string().regex(/^[A-Za-z0-9_-]{22}$/);
export const FormProductSchema = z.strictObject({
  /** Short code the form sends back, e.g. `sac-noir`. */
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,39}$/),
  name: z.string().trim().min(1).max(120),
  unitPrice: DinarsSchema.refine((price) => price > 0, 'A product needs a price'),
  /** Sizes or colours the customer picks from; empty when there is no choice. */
  variants: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});
export const FormThemeSchema = z.strictObject({
  /** Button and accent colour, `#rrggbb`. */
  accent: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#1f5c4a'),
});
const formFields = {
  name: z.string().trim().min(2).max(80),
  /** Shown above the form: the shop's name or the offer. */
  title: z.string().trim().min(2).max(120),
  products: z
    .array(FormProductSchema)
    .min(1)
    .max(30)
    .refine((items) => new Set(items.map((item) => item.id)).size === items.length, {
      message: 'Product ids must be unique',
    }),
  deliveryTypes: z.array(DeliveryTypeSchema).min(1).max(2).default(['home', 'stopdesk']),
  maxQuantity: z.number().int().min(1).max(50).default(5),
  theme: FormThemeSchema.default({ accent: '#1f5c4a' }),
};
/** `POST /orders/forms`. */
export const CreateOrderFormRequestSchema = z.strictObject(formFields);
/** `PUT /orders/forms/:id`: full replacement, plus switching the form off. */
export const UpdateOrderFormRequestSchema = z.strictObject({ ...formFields, enabled: z.boolean() });
export const OrderFormSchema = z.strictObject({
  id: z.uuid(),
  key: FormKeySchema,
  name: z.string(),
  title: z.string(),
  products: z.array(FormProductSchema),
  deliveryTypes: z.array(DeliveryTypeSchema),
  maxQuantity: z.number().int(),
  theme: FormThemeSchema,
  enabled: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export const ListOrderFormsResponseSchema = z.strictObject({ items: z.array(OrderFormSchema) });
/**
 * `GET /public/forms/:key`: what the customer's page needs, with the store's delivery prices so
 * the total updates on the phone without another request.
 */
export const PublicOrderFormSchema = z.strictObject({
  key: FormKeySchema,
  title: z.string(),
  products: z.array(FormProductSchema),
  deliveryTypes: z.array(DeliveryTypeSchema),
  maxQuantity: z.number().int(),
  theme: FormThemeSchema,
  /** Only the prices the store delivers at; empty when shipping could not be reached. */
  prices: z.array(StorePriceSchema.extend({ price: DinarsSchema })),
  freeShippingFrom: DinarsSchema.nullable(),
});
