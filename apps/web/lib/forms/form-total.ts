import {
  type DeliveryType,
  type PublicOrderForm,
  type Utm,
  freeShippingApplies,
} from '@trackecom/contracts';

export interface DeliveryOption {
  readonly deliveryType: DeliveryType;
  /** null when the store's prices could not be read: the shop confirms the fee on the call. */
  readonly price: number | null;
}

/** Delivery types the customer can pick for this wilaya, with their price. */
export function deliveryOptions(
  form: PublicOrderForm,
  wilayaCode: number | undefined,
): DeliveryOption[] {
  if (form.prices.length === 0)
    return form.deliveryTypes.map((deliveryType) => ({ deliveryType, price: null }));
  return form.prices
    .filter((row) => row.wilayaCode === wilayaCode)
    .map(({ deliveryType, price }) => ({ deliveryType, price }));
}

/** Only wilayas the store delivers to; all of them when prices are unknown. */
export function deliversTo(form: PublicOrderForm, wilayaCode: number): boolean {
  return form.prices.length === 0 || form.prices.some((row) => row.wilayaCode === wilayaCode);
}

export interface Pick {
  readonly productId: string;
  readonly quantity: number;
  readonly wilayaCode: number | undefined;
  readonly deliveryType: DeliveryType | undefined;
}

export interface Totals {
  readonly subtotal: number;
  readonly shippingFee: number | null;
  readonly total: number;
}

/** Same rule as the server: free shipping from the threshold, except in excluded wilayas. */
export function totalsOf(form: PublicOrderForm, pick: Pick): Totals {
  const product = form.products.find((item) => item.id === pick.productId);
  const subtotal = (product?.unitPrice ?? 0) * pick.quantity;
  const option = deliveryOptions(form, pick.wilayaCode).find(
    (o) => o.deliveryType === pick.deliveryType,
  );
  const free =
    pick.wilayaCode !== undefined &&
    freeShippingApplies(form, { wilayaCode: pick.wilayaCode, subtotal });
  const shippingFee = option?.price == null ? null : free ? 0 : option.price;
  return { subtotal, shippingFee, total: subtotal + (shippingFee ?? 0) };
}

const UTM_KEYS = ['source', 'medium', 'campaign', 'content', 'term'] as const;

/** `utm_*` parameters the embed script passed on from the landing page. */
export function utmFrom(params: URLSearchParams): Utm | undefined {
  const entries = UTM_KEYS.flatMap((key) => {
    const value = params.get(`utm_${key}`)?.trim().slice(0, 100);
    return value ? [[key, value] as const] : [];
  });
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

/** "16 · Alger" or "16 · الجزائر". */
export function placeLabel(
  place: { nameAr: string; nameFr: string; code?: number },
  locale: string,
) {
  const name = locale === 'ar' ? place.nameAr : place.nameFr;
  return place.code === undefined ? name : `${String(place.code).padStart(2, '0')} · ${name}`;
}
