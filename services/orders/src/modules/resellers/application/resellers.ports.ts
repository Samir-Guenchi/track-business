import type {
  Reseller,
  ResellerInputSchema,
  ResellerOrder,
  ResellerPayoutResponse,
  ResellerProduct,
  ResellerProductInputSchema,
  ResellerStats,
  StorePricesResponse,
} from '@trackecom/contracts';
import type { z } from 'zod';

export const RESELLERS_STORE = Symbol('RESELLERS_STORE');
export const RESELLER_PRICES = Symbol('RESELLER_PRICES');

export type ResellerFields = z.output<typeof ResellerInputSchema>;
export type ProductFields = z.output<typeof ResellerProductInputSchema>;

export interface ResellerScope {
  readonly storeId: string;
  readonly resellerId: string;
}

/** The reseller behind a portal code. */
export interface PortalReseller extends ResellerScope {
  readonly name: string;
  readonly active: boolean;
}

export interface ResellersStore {
  resellers(storeId: string): Promise<Reseller[]>;
  createReseller(storeId: string, fields: ResellerFields & { portalCode: string }): Promise<void>;
  updateReseller(scope: ResellerScope, fields: ResellerFields): Promise<boolean>;
  catalogue(storeId: string): Promise<ResellerProduct[]>;
  createProduct(storeId: string, fields: ProductFields): Promise<ResellerProduct>;
  updateProduct(
    scope: { storeId: string; productId: string },
    fields: ProductFields,
  ): Promise<ResellerProduct | null>;
  orders(scope: ResellerScope): Promise<ResellerOrder[]>;
  stats(scope: ResellerScope): Promise<ResellerStats>;
  /** Marks delivered, unpaid orders as paid in one statement; returns their count and margin. */
  payout(scope: ResellerScope): Promise<ResellerPayoutResponse>;
  byPortalCode(portalCode: string): Promise<PortalReseller | null>;
  ordersSince(scope: ResellerScope, since: Date): Promise<number>;
  link(scope: ResellerScope, order: { orderId: string; margin: number }): Promise<void>;
}

/** The supplier's delivery prices (shipping service); null when it cannot be asked. */
export interface ResellerPriceSource {
  pricesFor(storeId: string): Promise<StorePricesResponse | null>;
}
