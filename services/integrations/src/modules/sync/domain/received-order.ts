import {
  AlgerianPhoneSchema,
  type ConnectorCode,
  type OrderReceivedEventInput,
  OrderReceivedEventSchema,
} from '@trackecom/contracts';
import type { ExternalOrder } from '@trackecom/connectors';

/** Why a shop order waits for the seller instead of becoming an order. */
export const IMPORT_PROBLEMS = ['currency', 'phone', 'address', 'invalid'] as const;
export type ImportProblem = (typeof IMPORT_PROBLEMS)[number];

export interface Location {
  readonly wilayaCode: number;
  readonly communeId: number;
}

export type Mapped =
  | { readonly ok: true; readonly data: OrderReceivedEventInput }
  | { readonly ok: false; readonly problem: ImportProblem };

const MAX = { name: 80, externalName: 60, itemName: 120, sku: 60, address: 255, notes: 1000 };
const clip = (text: string, max: number) => text.trim().slice(0, max);

function orderOf(order: ExternalOrder, location: Location) {
  const { customer } = order;
  return {
    customer: {
      name: clip(customer.name, MAX.name),
      phone: customer.phone ?? '',
      ...location,
      address: clip(customer.address ?? '', MAX.address),
    },
    items: order.items.map((item) => ({
      name: clip(item.name, MAX.itemName),
      ...(item.sku ? { sku: clip(item.sku, MAX.sku) } : {}),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    deliveryType: 'home' as const,
    shippingFee: order.shippingFee,
    discount: order.discount,
    ...(order.note ? { notes: clip(order.note, MAX.notes) } : {}),
  };
}

const header = (connector: ConnectorCode, order: ExternalOrder) => ({
  connector,
  externalId: order.externalId,
  externalName: clip(order.name, MAX.externalName),
  cancelled: order.cancelled,
});

/** A cancellation needs nothing but the shop order id. */
export const cancellationOf = (connector: ConnectorCode, order: ExternalOrder): Mapped => ({
  ok: true,
  data: { ...header(connector, order), order: null },
});

/**
 * Builds the event for a live shop order, or names the first problem the seller must fix: a
 * foreign currency, a missing or foreign phone, an address we cannot place, or anything else
 * the order contract refuses. Orders are created with home delivery, the shop default.
 */
export function receivedOrderOf(
  connector: ConnectorCode,
  order: ExternalOrder,
  location: Location | null,
): Mapped {
  if (order.currency !== 'DZD') return { ok: false, problem: 'currency' };
  if (!AlgerianPhoneSchema.safeParse(order.customer.phone ?? '').success) {
    return { ok: false, problem: 'phone' };
  }
  if (!location || !order.customer.address?.trim()) return { ok: false, problem: 'address' };
  const data = { ...header(connector, order), order: orderOf(order, location) };
  if (!OrderReceivedEventSchema.safeParse(data).success) return { ok: false, problem: 'invalid' };
  return { ok: true, data };
}
