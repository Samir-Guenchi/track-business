import type { DeliveryType, Order } from '@trackecom/contracts';

export interface DraftItem {
  /** Stable React key; never sent to the API. */
  readonly key: string;
  readonly name: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

/** What the agent is typing. Numbers stay numbers; text is trimmed when the request is built. */
export interface OrderDraft {
  readonly phone: string;
  readonly name: string;
  readonly wilayaCode: number | undefined;
  readonly communeId: number | undefined;
  readonly address: string;
  readonly deliveryType: DeliveryType;
  readonly stopDeskId: string;
  readonly items: readonly DraftItem[];
  /** Null: use the store's price for the wilaya; a number: the agent overrode it. */
  readonly shippingFeeOverride: number | null;
  readonly discount: number;
  readonly notes: string;
}

let itemCounter = 0;
export function newItem(): DraftItem {
  itemCounter += 1;
  return { key: `item-${itemCounter}`, name: '', quantity: 1, unitPrice: 0 };
}

export function emptyDraft(): OrderDraft {
  return {
    phone: '',
    name: '',
    wilayaCode: undefined,
    communeId: undefined,
    address: '',
    deliveryType: 'home',
    stopDeskId: '',
    items: [newItem()],
    shippingFeeOverride: null,
    discount: 0,
    notes: '',
  };
}

export function subtotalOf(items: readonly DraftItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

/** What the courier collects; the server computes the same `subtotal + fee - discount`. */
export function codAmountOf(draft: OrderDraft, quotedFee: number | null): number {
  const fee = draft.shippingFeeOverride ?? quotedFee ?? 0;
  return Math.max(0, subtotalOf(draft.items) + fee - draft.discount);
}

/** Fills the customer from their last order, keeping anything the agent already typed. */
export function withKnownCustomer(draft: OrderDraft, previous: Order['customer']): OrderDraft {
  return {
    ...draft,
    name: draft.name || previous.name,
    wilayaCode: draft.wilayaCode ?? previous.wilayaCode,
    communeId: draft.wilayaCode === undefined ? previous.communeId : draft.communeId,
    address: draft.address || (previous.address ?? ''),
  };
}

const optional = (text: string) => (text.trim() === '' ? undefined : text.trim());

/** The `POST /orders` body, ready for `CreateOrderRequestSchema.safeParse`. */
export function toCreateRequest(
  draft: OrderDraft,
  quotedFee: number | null,
): Record<string, unknown> {
  return {
    customer: {
      name: draft.name.trim(),
      phone: draft.phone,
      wilayaCode: draft.wilayaCode,
      communeId: draft.communeId,
      address: draft.deliveryType === 'home' ? optional(draft.address) : undefined,
    },
    items: draft.items.map(({ name, quantity, unitPrice }) => ({
      name: name.trim(),
      quantity,
      unitPrice,
    })),
    deliveryType: draft.deliveryType,
    stopDeskId: draft.deliveryType === 'stopdesk' ? optional(draft.stopDeskId) : undefined,
    // No store price and nothing typed: left out so the schema asks for it.
    shippingFee: draft.shippingFeeOverride ?? quotedFee ?? undefined,
    discount: draft.discount,
    notes: optional(draft.notes),
    source: 'manual',
  };
}
