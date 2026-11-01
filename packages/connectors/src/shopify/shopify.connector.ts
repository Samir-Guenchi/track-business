import type {
  ConnectorContext,
  ExternalOrder,
  Fulfilment,
  OrderPage,
  ShopInfo,
  WebhookRequest,
} from '../connector.types.js';
import type { StoreConnector } from '../store-connector.port.js';
import { type FetchLike, ShopifyClient } from './shopify-client.js';
import { pushShopifyFulfilment } from './shopify-fulfilment.js';
import { ORDERS_QUERY, type OrdersResult, fromGraphqlOrder } from './shopify-orders.js';
import { parseShopifyWebhook } from './shopify-webhook.js';

const PAGE_SIZE = 50;
const SHOP_QUERY = `query { shop { name currencyCode } }`;

/**
 * Shopify (#47), through the GraphQL Admin API. Connected by OAuth, so the seller types nothing:
 * the integrations service puts the shop's `accessToken` and the app's `webhookSecret` in the
 * context. Written from Shopify's public API reference; check against a development store
 * before production.
 */
export class ShopifyConnector implements StoreConnector {
  readonly code = 'shopify';
  readonly name = 'Shopify';
  readonly credentialFields = [];
  readonly capabilities = { webhooks: true, fulfilment: true };
  private readonly client: ShopifyClient;

  constructor(options: { fetch?: FetchLike } = {}) {
    this.client = new ShopifyClient(options.fetch ?? ((url, init) => globalThis.fetch(url, init)));
  }

  async validate(ctx: ConnectorContext): Promise<ShopInfo> {
    const { shop } = await this.client.graphql<{ shop: { name: string; currencyCode: string } }>(
      ctx,
      SHOP_QUERY,
    );
    return { name: shop.name, currency: shop.currencyCode };
  }

  async listOrders(
    ctx: ConnectorContext,
    page: { since: Date; cursor: string | null },
  ): Promise<OrderPage> {
    const { orders } = await this.client.graphql<OrdersResult>(ctx, ORDERS_QUERY, {
      first: PAGE_SIZE,
      after: page.cursor,
      query: `updated_at:>='${page.since.toISOString()}'`,
    });
    return {
      orders: orders.nodes.map(fromGraphqlOrder),
      nextCursor: orders.pageInfo.hasNextPage ? orders.pageInfo.endCursor : null,
    };
  }

  parseWebhook(ctx: ConnectorContext, request: WebhookRequest): Promise<ExternalOrder[]> {
    return Promise.resolve().then(() => parseShopifyWebhook(ctx, request));
  }

  pushFulfilment(ctx: ConnectorContext, fulfilment: Fulfilment): Promise<void> {
    return pushShopifyFulfilment(this.client, ctx, fulfilment);
  }
}
