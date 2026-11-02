import { ConnectorError } from '../connector.errors.js';
import type { ConnectorContext, Fulfilment } from '../connector.types.js';
import type { ShopifyClient } from './shopify-client.js';

const ORDER_FULFILMENT_QUERY = `query Fulfilment($id: ID!) {
  order(id: $id) {
    fulfillments(first: 20) { trackingInfo { number } }
    fulfillmentOrders(first: 20) { nodes { id status } }
  }
}`;

const CREATE_FULFILMENT = `mutation Fulfil($fulfillment: FulfillmentInput!) {
  fulfillmentCreate(fulfillment: $fulfillment) {
    fulfillment { id }
    userErrors { field message }
  }
}`;

interface FulfilmentState {
  readonly order: {
    readonly fulfillments: readonly { trackingInfo: readonly { number: string | null }[] }[];
    readonly fulfillmentOrders: { readonly nodes: readonly { id: string; status: string }[] };
  } | null;
}

interface CreateResult {
  readonly fulfillmentCreate: { readonly userErrors: readonly { message: string }[] };
}

/** Fulfillment orders still waiting to be shipped. */
const OPEN = ['OPEN', 'IN_PROGRESS', 'SCHEDULED'];

/**
 * Marks the Shopify order fulfilled with our tracking. Idempotent: if a fulfilment already
 * carries this tracking number, nothing is sent again. The customer is not emailed by Shopify;
 * our own messages (#46) tell them.
 */
export async function pushShopifyFulfilment(
  client: ShopifyClient,
  ctx: ConnectorContext,
  fulfilment: Fulfilment,
): Promise<void> {
  const id = `gid://shopify/Order/${fulfilment.externalId}`;
  const { order } = await client.graphql<FulfilmentState>(ctx, ORDER_FULFILMENT_QUERY, { id });
  if (!order)
    throw new ConnectorError('not_found', 'No such Shopify order', { connector: 'shopify' });
  const tracked = order.fulfillments.some((f) =>
    f.trackingInfo.some((t) => t.number === fulfilment.trackingNumber),
  );
  if (tracked) return;
  const open = order.fulfillmentOrders.nodes.filter((node) => OPEN.includes(node.status));
  if (open.length === 0) return;
  const result = await client.graphql<CreateResult>(ctx, CREATE_FULFILMENT, {
    fulfillment: {
      lineItemsByFulfillmentOrder: open.map((node) => ({ fulfillmentOrderId: node.id })),
      trackingInfo: {
        number: fulfilment.trackingNumber,
        url: fulfilment.trackingUrl,
        company: fulfilment.carrierName,
      },
      notifyCustomer: false,
    },
  });
  if (result.fulfillmentCreate.userErrors.length > 0) {
    throw new ConnectorError('validation', 'Shopify refused the fulfilment', {
      connector: 'shopify',
    });
  }
}
