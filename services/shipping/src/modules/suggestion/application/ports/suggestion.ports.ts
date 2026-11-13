import type { DeliveryType, SuggestionSettings } from '@trackecom/contracts';
import type { CarrierFacts } from '../../domain/carrier-facts.js';

export interface RouteQuery {
  readonly storeId: string;
  readonly originWilayaCode: number;
  readonly wilayaCode: number;
  readonly deliveryType: DeliveryType;
}

/** Everything known about the store's connected carriers for one route. */
export interface CarrierFactsSource {
  gather(route: RouteQuery): Promise<CarrierFacts[]>;
}

export interface SuggestionSettingsStore {
  /** The store's settings, or the defaults when it never saved any. */
  get(storeId: string): Promise<SuggestionSettings>;
  put(storeId: string, settings: SuggestionSettings): Promise<SuggestionSettings>;
}

export const CARRIER_FACTS = Symbol('CarrierFactsSource');
export const SUGGESTION_SETTINGS = Symbol('SuggestionSettingsStore');
