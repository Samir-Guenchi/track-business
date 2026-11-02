import { type DeliveryType, ShippingQuoteSchema } from '@trackecom/contracts';
import { apiRequest } from './api-client';

export interface QuoteQuery {
  readonly wilayaCode: number;
  readonly deliveryType: DeliveryType;
  readonly subtotal: number;
}

export const pricingApi = {
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
