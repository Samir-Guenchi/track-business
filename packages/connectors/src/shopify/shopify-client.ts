import { ConnectorError, connectorErrorKind } from '../connector.errors.js';
import type { ConnectorContext } from '../connector.types.js';

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

/** Admin API version this connector was written against; bump it with Shopify's calendar. */
export const SHOPIFY_API_VERSION = '2025-07';
const CODE = 'shopify';
const TIMEOUT_MS = 15_000;
/** Only real shop domains: the host is never taken from free user input (SSRF). */
const SHOP_DOMAIN = /^[a-z0-9][a-z0-9-]{0,60}\.myshopify\.com$/;

export function shopDomain(ctx: ConnectorContext): string {
  const host = ctx.shopUrl
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .toLowerCase();
  if (!SHOP_DOMAIN.test(host))
    throw new ConnectorError('validation', 'Not a myshopify.com shop', { connector: CODE });
  return host;
}

interface GraphqlBody<T> {
  readonly data?: T;
  readonly errors?: readonly { message: string; extensions?: { code?: string } }[];
}

/**
 * The only way the connector talks to Shopify: the shop's GraphQL Admin API, a timeout on every
 * call, and failures turned into ConnectorError. Response bodies never go into error messages:
 * they can hold customer data.
 */
export class ShopifyClient {
  constructor(private readonly fetchImpl: FetchLike) {}

  async graphql<T>(
    ctx: ConnectorContext,
    query: string,
    variables: Record<string, unknown> = {},
  ): Promise<T> {
    const url = `https://${shopDomain(ctx)}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
    const response = await this.fetchImpl(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-shopify-access-token': ctx.credentials['accessToken'] ?? '',
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }).catch(() => {
      throw new ConnectorError('unavailable', 'Shopify did not answer', { connector: CODE });
    });
    if (!response.ok) {
      const status = response.status;
      throw new ConnectorError(connectorErrorKind(status), `Shopify answered ${status}`, {
        connector: CODE,
        status,
      });
    }
    return this.dataOf<T>((await response.json()) as GraphqlBody<T>);
  }

  private dataOf<T>(body: GraphqlBody<T>): T {
    const throttled = body.errors?.some((error) => error.extensions?.code === 'THROTTLED');
    if (throttled)
      throw new ConnectorError('rate_limited', 'Shopify throttled the call', { connector: CODE });
    if (body.errors?.length || !body.data) {
      throw new ConnectorError('validation', 'Shopify refused the query', { connector: CODE });
    }
    return body.data;
  }
}
