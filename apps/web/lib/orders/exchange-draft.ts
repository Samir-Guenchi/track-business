import type { CreateExchangeRequest, Order } from '@trackecom/contracts';

export interface ExchangeDraftLine {
  readonly itemId: string;
  readonly name: string;
  readonly maxQuantity: number;
  readonly selected: boolean;
  readonly quantity: number;
  readonly replacement: string;
  readonly priceDifference: number;
}

export interface ExchangeDraft {
  readonly lines: readonly ExchangeDraftLine[];
  readonly deliveryPaidBy: 'customer' | 'store';
  readonly shippingFee: number;
}

/**
 * Every delivered item, unticked; the replacement starts as the old name to edit ("taille M" ->
 * "L"), followed by what the customer asked for when the exchange comes from their request (#201).
 */
export function initialExchangeDraft(order: Order, wanted?: string | null): ExchangeDraft {
  return {
    lines: order.items.map((item) => ({
      itemId: item.id,
      name: item.name,
      maxQuantity: item.quantity,
      selected: order.items.length === 1,
      quantity: item.quantity,
      replacement: wanted ? `${item.name} - ${wanted}`.slice(0, 120) : item.name,
      priceDifference: 0,
    })),
    deliveryPaidBy: 'customer',
    shippingFee: order.shippingFee,
  };
}

const chosen = (draft: ExchangeDraft) =>
  draft.lines.filter((line) => line.selected && line.replacement.trim() !== '');

/** What the courier collects on the exchange, as the server computes it. */
export function exchangeAmount(draft: ExchangeDraft): number {
  const difference = chosen(draft).reduce((sum, l) => sum + l.quantity * l.priceDifference, 0);
  return difference + (draft.deliveryPaidBy === 'customer' ? draft.shippingFee : 0);
}

/** Null until at least one item is ticked with a replacement. */
export function toExchangeRequest(draft: ExchangeDraft): CreateExchangeRequest | null {
  const lines = chosen(draft).map(({ itemId, quantity, replacement, priceDifference }) => ({
    itemId,
    quantity,
    replacement: replacement.trim(),
    priceDifference,
  }));
  if (lines.length === 0) return null;
  return { lines, deliveryPaidBy: draft.deliveryPaidBy, shippingFee: draft.shippingFee };
}
