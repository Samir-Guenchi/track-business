import { randomBytes } from 'node:crypto';
import type { MarginState, OrderStatus, ResellerProduct } from '@trackecom/contracts';
import { ResellerPriceError } from './reseller.errors.js';

/** 24 url-safe characters: the reseller's portal link cannot be guessed. */
export const newPortalCode = (): string => randomBytes(18).toString('base64url');

/** Orders whose margin will never be owed. */
export const VOID_STATUSES: readonly OrderStatus[] = ['cancelled', 'returning', 'returned'];

export function marginState(status: OrderStatus, paidAt: Date | null): MarginState {
  if (paidAt) return 'paid';
  if (status === 'delivered') return 'earned';
  return VOID_STATUSES.includes(status) ? 'void' : 'pending';
}

export interface PickedItem {
  readonly productId: string;
  readonly quantity: number;
  readonly sellingPrice: number;
}

export interface PricedItems {
  readonly items: { productId: string; name: string; quantity: number; unitPrice: number }[];
  readonly subtotal: number;
  /** What the reseller earns: selling price minus supplier price, for every unit. */
  readonly margin: number;
}

/** Checks each pick against the catalogue and works out the subtotal and the margin. */
export function priceItems(catalogue: readonly ResellerProduct[], picks: readonly PickedItem[]) {
  const priced: PricedItems = { items: [], subtotal: 0, margin: 0 };
  return picks.reduce<PricedItems>((total, pick) => {
    const product = catalogue.find((item) => item.id === pick.productId && item.active);
    if (!product) throw new ResellerPriceError('This product is not offered to resellers');
    const floor = Math.max(product.supplierPrice, product.minPrice ?? 0);
    if (pick.sellingPrice < floor) {
      throw new ResellerPriceError(`Selling price under ${floor} DA for ${product.name}`);
    }
    const item = {
      productId: product.id,
      name: product.name,
      quantity: pick.quantity,
      unitPrice: pick.sellingPrice,
    };
    return {
      items: [...total.items, item],
      subtotal: total.subtotal + pick.sellingPrice * pick.quantity,
      margin: total.margin + (pick.sellingPrice - product.supplierPrice) * pick.quantity,
    };
  }, priced);
}

/** delivered / (delivered + returned), null before the first final order. */
export const deliveryRate = (delivered: number, returned: number): number | null =>
  delivered + returned === 0 ? null : delivered / (delivered + returned);
