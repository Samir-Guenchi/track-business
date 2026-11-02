import type { DeliveryType, OrderItemInput } from '@trackecom/contracts';
import type { OrderCustomer, OrderLine } from '../domain/order.js';
import { itemsFingerprint } from '../domain/order-identity.js';
import { computeTotals } from '../domain/order-pricing.js';
import type { IdGenerator } from './ports/orders.ports.js';

/** The editable part of an order, shared by create and update requests (already validated). */
export interface OrderInput {
  readonly customer: {
    readonly name: string;
    readonly phone: string;
    readonly phone2?: string | undefined;
    readonly wilayaCode: number;
    readonly communeId: number;
    readonly address?: string | undefined;
  };
  readonly items: readonly OrderItemInput[];
  readonly deliveryType: DeliveryType;
  readonly stopDeskId?: string | undefined;
  readonly shippingFee: number;
  readonly discount: number;
  readonly notes?: string | undefined;
  readonly tags: readonly string[];
}

/** Turns validated input into the stored shape: totals, lines, fingerprint, nulls. */
export function draftFromInput(input: OrderInput, newId: IdGenerator) {
  const totals = computeTotals(input.items, input.shippingFee, input.discount);
  const items: OrderLine[] = input.items.map((item, index) => ({
    id: newId(),
    productId: item.productId ?? null,
    name: item.name,
    sku: item.sku ?? null,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: totals.lineTotals[index] ?? 0,
  }));
  const isHome = input.deliveryType === 'home';
  const customer: OrderCustomer = {
    name: input.customer.name,
    phone: input.customer.phone,
    phone2: input.customer.phone2 ?? null,
    wilayaCode: input.customer.wilayaCode,
    communeId: input.customer.communeId,
    address: isHome ? (input.customer.address ?? null) : null,
  };
  return {
    customer,
    items,
    deliveryType: input.deliveryType,
    stopDeskId: isHome ? null : (input.stopDeskId ?? null),
    subtotal: totals.subtotal,
    shippingFee: input.shippingFee,
    discount: input.discount,
    codAmount: totals.codAmount,
    notes: input.notes ?? null,
    tags: [...new Set(input.tags)],
    itemsFingerprint: itemsFingerprint(input.items),
  };
}
