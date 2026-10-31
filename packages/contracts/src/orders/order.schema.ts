import { z } from 'zod';
import { CustomerInputSchema, CustomerSchema } from './customer.schema.js';
import { OrderStatusSchema } from './order-status.js';

/** Amounts are whole Algerian dinars (DZD); centimes are not used in e-commerce. */
export const DinarsSchema = z.number().int().min(0).max(100_000_000);

export const DeliveryTypeSchema = z.enum(['home', 'stopdesk']);
export type DeliveryType = z.infer<typeof DeliveryTypeSchema>;

export const OrderSourceSchema = z.enum([
  'manual',
  'csv_import',
  'google_sheets',
  'shopify',
  'woocommerce',
  'youcan',
  'social',
  'api',
]);
export type OrderSource = z.infer<typeof OrderSourceSchema>;

/** Lowercase words and dashes, e.g. `vip`, `ramadan-promo`. */
export const TagSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[\p{L}\p{N}][\p{L}\p{N}-]{0,29}$/u);

export const OrderItemInputSchema = z.strictObject({
  /** Set when the item comes from the catalog (#27); free-text items are allowed too. */
  productId: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(120),
  sku: z.string().trim().max(60).optional(),
  quantity: z.number().int().min(1).max(999),
  unitPrice: DinarsSchema,
});
export type OrderItemInput = z.infer<typeof OrderItemInputSchema>;

const orderFields = {
  customer: CustomerInputSchema,
  items: z.array(OrderItemInputSchema).min(1).max(50),
  deliveryType: DeliveryTypeSchema,
  stopDeskId: z.string().min(1).optional(),
  shippingFee: DinarsSchema,
  discount: DinarsSchema.default(0),
  notes: z.string().trim().max(1000).optional(),
  tags: z.array(TagSchema).max(10).default([]),
};

const deliveryIsComplete = (order: {
  deliveryType: DeliveryType;
  stopDeskId?: string | undefined;
  customer: { address?: string | undefined };
}) => (order.deliveryType === 'home' ? Boolean(order.customer.address) : Boolean(order.stopDeskId));

const DELIVERY_MESSAGE = 'Home delivery needs an address; stop-desk delivery needs a stopDeskId';

/** `POST /orders`. The total to collect (codAmount) is computed by the server. */
export const CreateOrderRequestSchema = z
  .strictObject({
    ...orderFields,
    source: OrderSourceSchema.default('manual'),
    /** The order id in the source system (Shopify id, sheet row...), used to avoid re-imports. */
    externalRef: z.string().trim().max(100).optional(),
  })
  .refine(deliveryIsComplete, { message: DELIVERY_MESSAGE, path: ['deliveryType'] });
export type CreateOrderRequest = z.input<typeof CreateOrderRequestSchema>;

/** `PUT /orders/:id`: full replacement of the editable fields, only before shipping. */
export const UpdateOrderRequestSchema = z
  .strictObject(orderFields)
  .refine(deliveryIsComplete, { message: DELIVERY_MESSAGE, path: ['deliveryType'] });
export type UpdateOrderRequest = z.input<typeof UpdateOrderRequestSchema>;

export const OrderItemSchema = OrderItemInputSchema.extend({
  id: z.string().min(1),
  productId: z.string().nullable(),
  sku: z.string().nullable(),
  lineTotal: DinarsSchema,
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderSchema = z.strictObject({
  id: z.string().min(1),
  /** Short human reference shown to sellers and customers, e.g. `TE-4F7K2Q`. */
  ref: z.string(),
  status: OrderStatusSchema,
  source: OrderSourceSchema,
  externalRef: z.string().nullable(),
  customer: CustomerSchema,
  items: z.array(OrderItemSchema),
  deliveryType: DeliveryTypeSchema,
  stopDeskId: z.string().nullable(),
  subtotal: DinarsSchema,
  shippingFee: DinarsSchema,
  discount: DinarsSchema,
  codAmount: DinarsSchema,
  notes: z.string().nullable(),
  tags: z.array(z.string()),
  assignedAgentId: z.string().nullable(),
  carrier: z.string().nullable(),
  trackingNumber: z.string().nullable(),
  /** Another order with the same phone and items in the previous 48 h, if any. */
  possibleDuplicateOfId: z.string().nullable(),
  postponedUntil: z.iso.datetime().nullable(),
  statusChangedAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Order = z.infer<typeof OrderSchema>;
