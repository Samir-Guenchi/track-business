import type { ConnectorCode, CredentialField } from '@trackecom/contracts';
import type {
  ConnectorContext,
  ExternalOrder,
  Fulfilment,
  OrderPage,
  ShopInfo,
  WebhookRequest,
} from './connector.types.js';

export interface ConnectorCapabilities {
  /** Pushes orders to us; without it the integration polls `listOrders`. */
  readonly webhooks: boolean;
  /** Accepts a tracking number back (fulfilment). */
  readonly fulfilment: boolean;
}

/**
 * Every shop platform implements this port (#47 Shopify, #48 WooCommerce and YouCan). Like
 * carrier adapters, connectors are stateless: the shop and its secrets come in the context on
 * every call, and they throw ConnectorError, never raw HTTP errors. Adding a platform = one
 * class + one registry line.
 */
export interface StoreConnector {
  readonly code: ConnectorCode;
  /** Display name, e.g. "Shopify". */
  readonly name: string;
  /** What the seller types to connect (empty for OAuth platforms). */
  readonly credentialFields: readonly CredentialField[];
  readonly capabilities: ConnectorCapabilities;

  /** Checks the credentials by reading the shop; ConnectorError 'auth' when they are wrong. */
  validate(ctx: ConnectorContext): Promise<ShopInfo>;
  /** Orders created or updated since `since`, oldest first: the backfill and polling path. */
  listOrders(
    ctx: ConnectorContext,
    page: { since: Date; cursor: string | null },
  ): Promise<OrderPage>;
  /** Verifies the signature (ConnectorError 'auth' when wrong) and returns the orders inside. */
  parseWebhook(ctx: ConnectorContext, request: WebhookRequest): Promise<ExternalOrder[]>;
  /** Marks the order fulfilled with our tracking; idempotent for the same tracking number. */
  pushFulfilment(ctx: ConnectorContext, fulfilment: Fulfilment): Promise<void>;
}
