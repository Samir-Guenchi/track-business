import type { StorePricesResponse } from '@trackecom/contracts';
import type { OrderFormRecord } from '../domain/order-form.js';

export const ORDER_FORM_STORE = Symbol('ORDER_FORM_STORE');
export const STORE_PRICES = Symbol('STORE_PRICES');

/** Persistence of order forms; seller reads are scoped by store, public reads by key. */
export interface OrderFormStore {
  list(storeId: string): Promise<OrderFormRecord[]>;
  byId(storeId: string, id: string): Promise<OrderFormRecord | null>;
  byKey(key: string): Promise<OrderFormRecord | null>;
  insert(form: OrderFormRecord): Promise<void>;
  /** Replaces the editable fields; false when the form is not in this store. */
  update(form: OrderFormRecord): Promise<boolean>;
}

/** The store's delivery prices, owned by shipping. null when shipping cannot be reached. */
export interface StorePriceSource {
  pricesFor(storeId: string): Promise<StorePricesResponse | null>;
}
