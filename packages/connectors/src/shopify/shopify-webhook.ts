import { createHmac, timingSafeEqual } from 'node:crypto';
import { ConnectorError } from '../connector.errors.js';
import type { ConnectorContext, ExternalOrder, WebhookRequest } from '../connector.types.js';
import { toAmount, toExternalOrder } from './shopify-mapping.js';

/** Topics we subscribe to; anything else is acknowledged and ignored. */
export const ORDER_TOPICS = ['orders/create', 'orders/updated', 'orders/cancelled'];

/** Shopify signs the raw body with the app's client secret: base64 HMAC-SHA256. */
export function verifyShopifySignature(ctx: ConnectorContext, request: WebhookRequest): void {
  const secret = ctx.credentials['webhookSecret'];
  const signature = request.headers['x-shopify-hmac-sha256'];
  const expected = secret ? createHmac('sha256', secret).update(request.rawBody).digest() : null;
  const given = signature ? Buffer.from(signature, 'base64') : null;
  if (
    !expected ||
    !given ||
    given.length !== expected.length ||
    !timingSafeEqual(given, expected)
  ) {
    throw new ConnectorError('auth', 'Bad Shopify webhook signature', { connector: 'shopify' });
  }
}

/** The REST-shaped order JSON Shopify posts to webhooks (only the fields we read). */
interface RestOrder {
  id: number | string;
  name: string;
  created_at: string;
  updated_at: string;
  currency: string;
  cancelled_at: string | null;
  note: string | null;
  phone: string | null;
  total_discounts: string | null;
  total_shipping_price_set?: { shop_money: { amount: string } } | null;
  customer?: { phone: string | null } | null;
  shipping_address?: {
    name: string | null;
    phone: string | null;
    address1: string | null;
    address2: string | null;
    city: string | null;
    province: string | null;
    province_code: string | null;
    zip: string | null;
  } | null;
  line_items: { title: string; sku: string | null; quantity: number; price: string }[];
}

export function fromWebhookOrder(order: RestOrder): ExternalOrder {
  const address = order.shipping_address;
  return toExternalOrder({
    id: String(order.id),
    name: order.name,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    currency: order.currency,
    cancelledAt: order.cancelled_at,
    note: order.note,
    phones: [order.phone, order.customer?.phone],
    address: address
      ? {
          name: address.name,
          phone: address.phone,
          line1: address.address1,
          line2: address.address2,
          city: address.city,
          province: address.province || address.province_code,
          zip: address.zip,
        }
      : null,
    items: order.line_items.map((item) => ({
      name: item.title,
      sku: item.sku || null,
      quantity: item.quantity,
      unitPrice: toAmount(item.price),
    })),
    shipping: order.total_shipping_price_set?.shop_money.amount,
    discount: order.total_discounts,
  });
}

/** Verifies, then reads the order out of an `orders/*` webhook. */
export function parseShopifyWebhook(
  ctx: ConnectorContext,
  request: WebhookRequest,
): ExternalOrder[] {
  verifyShopifySignature(ctx, request);
  if (!ORDER_TOPICS.includes(request.headers['x-shopify-topic'] ?? '')) return [];
  try {
    return [fromWebhookOrder(JSON.parse(request.rawBody) as RestOrder)];
  } catch {
    throw new ConnectorError('validation', 'Unreadable Shopify webhook', { connector: 'shopify' });
  }
}
