import { randomBytes } from 'node:crypto';
import type { DeliveryType, FormProduct, StorePrice } from '@trackecom/contracts';

export interface OrderFormRecord {
  readonly id: string;
  readonly storeId: string;
  readonly key: string;
  readonly name: string;
  readonly title: string;
  readonly products: readonly FormProduct[];
  readonly deliveryTypes: readonly DeliveryType[];
  readonly maxQuantity: number;
  readonly accent: string;
  readonly enabled: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** 16 random bytes, base64url: 22 characters nobody can guess or count through. */
export const newFormKey = (): string => randomBytes(16).toString('base64url');

export interface PricedDelivery {
  readonly wilayaCode: number;
  readonly deliveryType: DeliveryType;
  readonly price: number;
}

/** The prices a customer can choose: set by the store and offered by this form. */
export function offeredPrices(
  prices: readonly StorePrice[],
  deliveryTypes: readonly DeliveryType[],
): PricedDelivery[] {
  return prices.flatMap(({ wilayaCode, deliveryType, price }) =>
    price !== null && deliveryTypes.includes(deliveryType)
      ? [{ wilayaCode, deliveryType, price }]
      : [],
  );
}
