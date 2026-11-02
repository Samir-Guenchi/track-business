import type { DeliveryType, ShippingQuote, StorePrice } from '@trackecom/contracts';

export const DELIVERY_TYPES: readonly DeliveryType[] = ['home', 'stopdesk'];

export interface QuoteInput {
  /** The store's selling price for this wilaya and delivery type; null or missing when not set. */
  readonly price: number | null | undefined;
  readonly freeShippingFrom: number | null;
  readonly subtotal: number;
}

/** The fee the customer pays: unavailable without a price, free once the subtotal reaches the rule. */
export function quoteShipping({ price, freeShippingFrom, subtotal }: QuoteInput): ShippingQuote {
  if (price === null || price === undefined) {
    return { available: false, fee: null, freeShippingApplied: false };
  }
  const free = freeShippingFrom !== null && subtotal >= freeShippingFrom;
  return { available: true, fee: free ? 0 : price, freeShippingApplied: free && price > 0 };
}

export const priceKey = (wilayaCode: number, deliveryType: DeliveryType) =>
  `${wilayaCode}:${deliveryType}`;

/** Every wilaya x delivery type in code order, so the settings screen never misses a row. */
export function fillPriceGrid(
  wilayaCodes: readonly number[],
  saved: readonly StorePrice[],
): StorePrice[] {
  const byKey = new Map(saved.map((row) => [priceKey(row.wilayaCode, row.deliveryType), row]));
  return [...wilayaCodes]
    .sort((a, b) => a - b)
    .flatMap((wilayaCode) =>
      DELIVERY_TYPES.map((deliveryType) => ({
        wilayaCode,
        deliveryType,
        price: byKey.get(priceKey(wilayaCode, deliveryType))?.price ?? null,
      })),
    );
}

/** Codes that are not current wilayas, sorted and without repeats. */
export function unknownCodes(codes: readonly number[], known: ReadonlySet<number>): number[] {
  return [...new Set(codes.filter((code) => !known.has(code)))].sort((a, b) => a - b);
}
