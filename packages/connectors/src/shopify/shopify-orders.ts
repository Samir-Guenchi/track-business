import type { ExternalOrder } from '../connector.types.js';
import { toAmount, toExternalOrder } from './shopify-mapping.js';

const money = `shopMoney { amount }`;

/** Orders updated since a date, oldest first: the backfill and polling page. */
export const ORDERS_QUERY = `query Orders($first: Int!, $after: String, $query: String!) {
  orders(first: $first, after: $after, query: $query, sortKey: UPDATED_AT) {
    pageInfo { hasNextPage endCursor }
    nodes {
      legacyResourceId name createdAt updatedAt currencyCode cancelledAt note phone
      totalDiscountsSet { ${money} }
      totalShippingPriceSet { ${money} }
      customer { phone }
      shippingAddress { name phone address1 address2 city province provinceCode zip }
      lineItems(first: 100) { nodes { title sku quantity originalUnitPriceSet { ${money} } } }
    }
  }
}`;

interface Money {
  readonly shopMoney: { readonly amount: string };
}

export interface GraphqlOrder {
  readonly legacyResourceId: string;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly currencyCode: string;
  readonly cancelledAt: string | null;
  readonly note: string | null;
  readonly phone: string | null;
  readonly totalDiscountsSet: Money | null;
  readonly totalShippingPriceSet: Money | null;
  readonly customer: { readonly phone: string | null } | null;
  readonly shippingAddress: {
    readonly name: string | null;
    readonly phone: string | null;
    readonly address1: string | null;
    readonly address2: string | null;
    readonly city: string | null;
    readonly province: string | null;
    readonly provinceCode: string | null;
    readonly zip: string | null;
  } | null;
  readonly lineItems: {
    readonly nodes: readonly {
      title: string;
      sku: string | null;
      quantity: number;
      originalUnitPriceSet: Money;
    }[];
  };
}

export interface OrdersResult {
  readonly orders: {
    readonly pageInfo: { readonly hasNextPage: boolean; readonly endCursor: string | null };
    readonly nodes: readonly GraphqlOrder[];
  };
}

export function fromGraphqlOrder(order: GraphqlOrder): ExternalOrder {
  const address = order.shippingAddress;
  return toExternalOrder({
    id: order.legacyResourceId,
    name: order.name,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    currency: order.currencyCode,
    cancelledAt: order.cancelledAt,
    note: order.note,
    phones: [order.phone, order.customer?.phone],
    address: address && {
      name: address.name,
      phone: address.phone,
      line1: address.address1,
      line2: address.address2,
      city: address.city,
      province: address.province || address.provinceCode,
      zip: address.zip,
    },
    items: order.lineItems.nodes.map((item) => ({
      name: item.title,
      sku: item.sku || null,
      quantity: item.quantity,
      unitPrice: toAmount(item.originalUnitPriceSet.shopMoney.amount),
    })),
    shipping: order.totalShippingPriceSet?.shopMoney.amount,
    discount: order.totalDiscountsSet?.shopMoney.amount,
  });
}
