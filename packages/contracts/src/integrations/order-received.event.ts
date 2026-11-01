import { z } from 'zod';
import { CreateOrderRequestSchema } from '../orders/order.schema.js';
import { ConnectorCodeSchema } from './integration.schema.js';

/** Events integrations publishes (ADR-0003). */
export const INTEGRATION_EVENTS = {
  orderReceived: 'integrations.order.received.v1',
} as const;

/** The order as orders will create it: source and externalRef come from the event itself. */
const ImportedOrderSchema = CreateOrderRequestSchema.transform(
  ({ source: _source, externalRef: _externalRef, ...order }) => order,
);

/**
 * A new, changed or cancelled shop order, with its address already matched to wilaya and
 * commune codes. Orders creates it once per `(store, connector, externalId)`: replays and
 * webhook-plus-polling overlaps are no-ops. Contains personal data: consumers keep it only on the
 * order.
 */
export const OrderReceivedEventSchema = z.strictObject({
  connector: ConnectorCodeSchema,
  externalId: z.string().min(1).max(100),
  /** What the seller sees in their shop, e.g. `#1042`. */
  externalName: z.string().max(60),
  /** Cancelled in the shop: an imported order is cancelled too, a new one is skipped. */
  cancelled: z.boolean(),
  order: ImportedOrderSchema,
});
export type OrderReceivedEvent = z.infer<typeof OrderReceivedEventSchema>;
export type OrderReceivedEventInput = z.input<typeof OrderReceivedEventSchema>;
