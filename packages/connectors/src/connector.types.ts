/** One online store connected to TrackEcom (a Shopify shop, a WooCommerce site...). */
export interface ConnectorContext {
  readonly storeId: string;
  /** The shop's address, e.g. `my-shop.myshopify.com` or `https://shop.dz`. */
  readonly shopUrl: string;
  /** Decrypted secrets, keyed by the connector's credential fields (or OAuth tokens). */
  readonly credentials: Readonly<Record<string, string>>;
}

export interface ShopInfo {
  readonly name: string;
  readonly currency: string;
}

/** The buyer as the shop stored it: free text, matched to our wilaya/commune codes later. */
export interface ExternalCustomer {
  readonly name: string;
  readonly phone: string | null;
  readonly address: string | null;
  readonly city: string | null;
  /** Wilaya as the shop names it ("Alger", "16 - Alger", "DZ-16"...). */
  readonly province: string | null;
  readonly zip: string | null;
}

export interface ExternalItem {
  readonly name: string;
  readonly sku: string | null;
  readonly quantity: number;
  /** In the shop's currency, smallest whole unit (DZD for Algerian shops). */
  readonly unitPrice: number;
}

/** An order as every connector returns it, whatever the platform. */
export interface ExternalOrder {
  /** The platform's own id; with the connector code it makes the order unique. */
  readonly externalId: string;
  /** What the seller sees in their shop, e.g. `#1042`. */
  readonly name: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly currency: string;
  readonly customer: ExternalCustomer;
  readonly items: readonly ExternalItem[];
  readonly shippingFee: number;
  readonly discount: number;
  readonly note: string | null;
  /** Cancelled in the shop: an imported order is cancelled too, a new one is skipped. */
  readonly cancelled: boolean;
}

export interface WebhookRequest {
  readonly headers: Readonly<Record<string, string | undefined>>;
  readonly rawBody: string;
}

export interface OrderPage {
  readonly orders: readonly ExternalOrder[];
  /** null on the last page. */
  readonly nextCursor: string | null;
}

/** Tracking pushed back to the shop once we ship the order. */
export interface Fulfilment {
  readonly externalId: string;
  readonly carrierName: string;
  readonly trackingNumber: string;
  /** Our public tracking page, never the carrier's. */
  readonly trackingUrl: string;
}
