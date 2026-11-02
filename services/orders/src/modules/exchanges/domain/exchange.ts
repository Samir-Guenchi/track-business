import type { CreateExchangeRequest, ExchangeLine, OrderItemInput } from '@trackecom/contracts';
import type { OrderRecord } from '../../orders/domain/order.js';

export type ExchangeRefusal = 'not_delivered' | 'unknown_item' | 'too_many' | 'already_exchanged';

export interface ExchangePlan {
  readonly items: OrderItemInput[];
  /** What the courier takes back, as carriers print it: "1 x Robe (M), 2 x Ceinture". */
  readonly collect: string;
  readonly shippingFee: number;
}

type Lines = readonly Required<ExchangeLine>[];

/** Only a delivered order can be exchanged: the items must be with the customer. */
export function exchangeRefusal(order: OrderRecord, lines: Lines): ExchangeRefusal | null {
  if (order.status !== 'delivered') return 'not_delivered';
  for (const line of lines) {
    const item = order.items.find((each) => each.id === line.itemId);
    if (!item) return 'unknown_item';
    const asked = lines.filter((each) => each.itemId === line.itemId);
    if (asked.reduce((sum, each) => sum + each.quantity, 0) > item.quantity) return 'too_many';
  }
  return null;
}

/**
 * The new order: each replacement priced at its difference only, the trip charged to the
 * customer or absorbed by the store. Call after `exchangeRefusal` returned null.
 */
export function planExchange(
  order: OrderRecord,
  request: Pick<CreateExchangeRequest, 'deliveryPaidBy' | 'shippingFee'> & { lines: Lines },
): ExchangePlan {
  const items = request.lines.map((line) => {
    const original = order.items.find((each) => each.id === line.itemId);
    return {
      ...(original?.productId ? { productId: original.productId } : {}),
      name: line.replacement,
      quantity: line.quantity,
      unitPrice: line.priceDifference,
    };
  });
  const collect = request.lines
    .map((line) => {
      const original = order.items.find((each) => each.id === line.itemId);
      return `${line.quantity} x ${original?.name ?? line.itemId}`;
    })
    .join(', ');
  const shippingFee = request.deliveryPaidBy === 'customer' ? request.shippingFee : 0;
  return { items, collect, shippingFee };
}
