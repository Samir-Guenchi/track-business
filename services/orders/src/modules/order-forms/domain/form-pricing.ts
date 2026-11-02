import type { DeliveryType, FormProduct, StorePricesResponse } from '@trackecom/contracts';
import { DeliveryUnavailableError, FormProductError } from './order-form.errors.js';
import type { OrderFormRecord } from './order-form.js';

export interface FormChoice {
  readonly productId: string;
  readonly variant?: string | undefined;
  readonly quantity: number;
  readonly wilayaCode: number;
  readonly deliveryType: DeliveryType;
}

export interface PricedChoice {
  readonly product: FormProduct;
  readonly itemName: string;
  readonly subtotal: number;
  /** null when shipping could not be asked: the order is taken and the fee checked on the call. */
  readonly shippingFee: number | null;
}

/** Checks the choice against the form and prices it with the store's delivery prices. */
export function priceChoice(
  form: OrderFormRecord,
  choice: FormChoice,
  prices: StorePricesResponse | null,
): PricedChoice {
  const product = pickProduct(form, choice);
  const subtotal = product.unitPrice * choice.quantity;
  const itemName = choice.variant ? `${product.name} (${choice.variant})` : product.name;
  return { product, itemName, subtotal, shippingFee: shippingFeeOf(choice, subtotal, prices) };
}

function pickProduct(form: OrderFormRecord, choice: FormChoice): FormProduct {
  const product = form.products.find((item) => item.id === choice.productId);
  if (!product) throw new FormProductError('This product is not on the form');
  if (choice.quantity > form.maxQuantity) throw new FormProductError('Quantity above the limit');
  const variantOk =
    product.variants.length === 0 || product.variants.includes(choice.variant ?? '');
  if (!variantOk) throw new FormProductError('Pick one of the offered variants');
  if (!form.deliveryTypes.includes(choice.deliveryType)) {
    throw new DeliveryUnavailableError('This delivery type is not offered');
  }
  return product;
}

function shippingFeeOf(choice: FormChoice, subtotal: number, prices: StorePricesResponse | null) {
  if (!prices) return null;
  const row = prices.items.find(
    (item) => item.wilayaCode === choice.wilayaCode && item.deliveryType === choice.deliveryType,
  );
  if (row?.price === null || row?.price === undefined) {
    throw new DeliveryUnavailableError('The store does not deliver there this way');
  }
  const free = prices.freeShippingFrom !== null && subtotal >= prices.freeShippingFrom;
  return free ? 0 : row.price;
}
