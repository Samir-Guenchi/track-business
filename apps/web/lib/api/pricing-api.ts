import {
  type DeliveryType,
  ShippingQuoteSchema,
  StorePricesResponseSchema,
  type UpdateStorePricesRequest,
} from '@trackecom/contracts';
import { apiRequest } from './api-client';

export interface QuoteQuery {
  readonly wilayaCode: number;
  readonly deliveryType: DeliveryType;
  readonly subtotal: number;
}

export const pricingApi = {
  storePrices: () =>
    apiRequest({ path: '/pricing/store-prices', schema: StorePricesResponseSchema }),
  updateStorePrices: (body: UpdateStorePricesRequest) =>
    apiRequest({
      path: '/pricing/store-prices',
      schema: StorePricesResponseSchema,
      method: 'PUT',
      body,
    }),
  quote: ({ wilayaCode, deliveryType, subtotal }: QuoteQuery) =>
    apiRequest({
      path: `/pricing/quote?${new URLSearchParams({
        wilayaCode: String(wilayaCode),
        deliveryType,
        subtotal: String(subtotal),
      }).toString()}`,
      schema: ShippingQuoteSchema,
    }),
};
