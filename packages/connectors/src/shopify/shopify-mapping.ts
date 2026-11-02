import type { ExternalCustomer, ExternalItem, ExternalOrder } from '../connector.types.js';

/** Money as Shopify sends it ("2500.00") in whole DZD. */
export const toAmount = (value: string | number | null | undefined): number =>
  Math.round(Number(value ?? 0));

/** A shipping address after both API shapes (GraphQL, webhook JSON) are read. */
export interface ShopifyAddress {
  readonly name: string | null;
  readonly phone: string | null;
  readonly line1: string | null;
  readonly line2: string | null;
  readonly city: string | null;
  readonly province: string | null;
  readonly zip: string | null;
}

/** One Shopify order, whichever API it came from. */
export interface ShopifyOrderParts {
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly currency: string;
  readonly cancelledAt: string | null;
  readonly note: string | null;
  /** Candidates, best first: address phone, order phone, customer phone. */
  readonly phones: readonly (string | null | undefined)[];
  readonly address: ShopifyAddress | null;
  readonly items: readonly ExternalItem[];
  readonly shipping: string | null | undefined;
  readonly discount: string | null | undefined;
}

const joined = (...parts: (string | null)[]): string | null =>
  parts.filter((part): part is string => Boolean(part?.trim())).join(', ') || null;

const firstPhone = (phones: ShopifyOrderParts['phones']): string | null =>
  phones.find((phone): phone is string => Boolean(phone)) ?? null;

function customerOf(parts: ShopifyOrderParts): ExternalCustomer {
  const address = parts.address;
  if (!address) {
    return {
      name: '',
      phone: firstPhone(parts.phones),
      address: null,
      city: null,
      province: null,
      zip: null,
    };
  }
  return {
    name: address.name ?? '',
    phone: firstPhone([address.phone, ...parts.phones]),
    address: joined(address.line1, address.line2),
    city: address.city,
    province: address.province,
    zip: address.zip,
  };
}

export function toExternalOrder(parts: ShopifyOrderParts): ExternalOrder {
  return {
    externalId: parts.id,
    name: parts.name,
    createdAt: new Date(parts.createdAt),
    updatedAt: new Date(parts.updatedAt),
    currency: parts.currency,
    customer: customerOf(parts),
    items: parts.items,
    shippingFee: toAmount(parts.shipping),
    discount: toAmount(parts.discount),
    note: parts.note || null,
    cancelled: parts.cancelledAt !== null,
  };
}
