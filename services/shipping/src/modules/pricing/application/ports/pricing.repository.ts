import type { DeliveryType, FreeShippingRule, RateCardRow, StorePrice } from '@trackecom/contracts';

export const PRICING_REPOSITORY = Symbol('PRICING_REPOSITORY');

export interface StorePriceChanges {
  readonly storeId: string;
  readonly items: readonly StorePrice[];
  /** undefined leaves the rule as it is; null turns it off. */
  readonly freeShippingFrom?: number | null | undefined;
  /** undefined leaves the list as it is. */
  readonly freeShippingExcludedWilayas?: readonly number[] | undefined;
}

export interface RateCardImport {
  readonly storeId: string;
  readonly carrier: string;
  readonly rows: readonly RateCardRow[];
  readonly importedAt: Date;
}

export interface PriceLookup {
  readonly storeId: string;
  readonly wilayaCode: number;
  readonly deliveryType: DeliveryType;
}

/** Store-scoped access to prices. Every method takes the storeId from the verified context. */
export interface PricingRepository {
  listStorePrices(storeId: string): Promise<StorePrice[]>;
  findStorePrice(lookup: PriceLookup): Promise<number | null>;
  freeShippingRule(storeId: string): Promise<FreeShippingRule>;
  saveStorePrices(changes: StorePriceChanges): Promise<void>;
  listRateCard(storeId: string, carrier: string): Promise<RateCardRow[]>;
  replaceRateCard(card: RateCardImport): Promise<void>;
}
