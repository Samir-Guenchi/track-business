import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { pricingApi } from '../api/pricing-api';
import { type OrderDraft, subtotalOf } from './order-draft';

/** The store's delivery price for the chosen wilaya; null while unknown or not available. */
export function useShippingQuote(draft: OrderDraft): { fee: number | null; unavailable: boolean } {
  const { wilayaCode, deliveryType } = draft;
  const subtotal = subtotalOf(draft.items);
  const quote = useQuery({
    queryKey: ['pricing', 'quote', wilayaCode, deliveryType, subtotal],
    queryFn: () => pricingApi.quote({ wilayaCode: wilayaCode ?? 0, deliveryType, subtotal }),
    enabled: wilayaCode !== undefined,
    placeholderData: keepPreviousData,
  });
  if (wilayaCode === undefined || !quote.data) return { fee: null, unavailable: false };
  return { fee: quote.data.available ? quote.data.fee : null, unavailable: !quote.data.available };
}
