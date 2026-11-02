import type { OrderItemInput } from '@trackecom/contracts';
import { InvalidAmountError } from './order.errors.js';

export interface Totals {
  readonly lineTotals: readonly number[];
  readonly subtotal: number;
  readonly codAmount: number;
}

/** What the delivery person collects: items + shipping - discount, in whole dinars. */
export function computeTotals(
  items: readonly Pick<OrderItemInput, 'quantity' | 'unitPrice'>[],
  shippingFee: number,
  discount: number,
): Totals {
  const lineTotals = items.map((item) => item.quantity * item.unitPrice);
  const subtotal = lineTotals.reduce((sum, value) => sum + value, 0);
  const codAmount = subtotal + shippingFee - discount;
  if (codAmount < 0) throw new InvalidAmountError();
  return { lineTotals, subtotal, codAmount };
}
