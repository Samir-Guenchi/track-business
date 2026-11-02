import type { ConnectorCode } from '@trackecom/contracts';
import { ConnectorError } from '../connector.errors.js';
import type {
  ConnectorContext,
  ExternalOrder,
  Fulfilment,
  OrderPage,
  ShopInfo,
  WebhookRequest,
} from '../connector.types.js';
import type { StoreConnector } from '../store-connector.port.js';

const PAGE_SIZE = 2;

/**
 * In-memory shop for tests and local development. The credential `token` must be `good`;
 * webhooks are signed by sending that token in `x-fake-signature` and a JSON order list.
 */
export class FakeConnector implements StoreConnector {
  readonly name = 'Fake shop';
  readonly credentialFields = [{ key: 'token', label: 'Token', secret: true }];
  readonly capabilities = { webhooks: true, fulfilment: true };
  readonly fulfilments: Fulfilment[] = [];
  orders: ExternalOrder[] = [];

  constructor(readonly code: ConnectorCode = 'shopify') {}

  async validate(ctx: ConnectorContext): Promise<ShopInfo> {
    this.authorize(ctx);
    return { name: 'Fake shop', currency: 'DZD' };
  }

  async listOrders(
    ctx: ConnectorContext,
    page: { since: Date; cursor: string | null },
  ): Promise<OrderPage> {
    this.authorize(ctx);
    const recent = this.orders.filter((order) => order.updatedAt >= page.since);
    const start = page.cursor ? Number(page.cursor) : 0;
    const end = start + PAGE_SIZE;
    return {
      orders: recent.slice(start, end),
      nextCursor: end < recent.length ? String(end) : null,
    };
  }

  async parseWebhook(ctx: ConnectorContext, request: WebhookRequest): Promise<ExternalOrder[]> {
    if (request.headers['x-fake-signature'] !== ctx.credentials['token']) {
      throw new ConnectorError('auth', 'Bad webhook signature', { connector: this.code });
    }
    const orders = JSON.parse(request.rawBody) as ExternalOrder[];
    return orders.map((order) => ({
      ...order,
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt),
    }));
  }

  async pushFulfilment(ctx: ConnectorContext, fulfilment: Fulfilment): Promise<void> {
    this.authorize(ctx);
    const known = this.orders.some((order) => order.externalId === fulfilment.externalId);
    if (!known) throw new ConnectorError('not_found', 'No such order', { connector: this.code });
    const already = this.fulfilments.some(
      (each) =>
        each.externalId === fulfilment.externalId &&
        each.trackingNumber === fulfilment.trackingNumber,
    );
    if (!already) this.fulfilments.push(fulfilment);
  }

  private authorize(ctx: ConnectorContext): void {
    if (ctx.credentials['token'] !== 'good') {
      throw new ConnectorError('auth', 'Invalid token', { connector: this.code });
    }
  }
}
