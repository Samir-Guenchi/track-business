import {
  DeliveryTypeSchema,
  type Order,
  OrderSourceSchema,
  OrderStatusSchema,
} from '@trackecom/contracts';
import type {
  Order as OrderRow,
  OrderItem as OrderItemRow,
  Prisma,
} from '../../../generated/prisma/client.js';
import type { OrderRecord } from '../domain/order.js';

export type OrderRowWithItems = OrderRow & { items: OrderItemRow[] };

export const WITH_ITEMS = { items: { orderBy: { position: 'asc' } } } as const;

/** Lowercase text matched by `q` (the phone has its own index). */
export const searchTextOf = (order: OrderRecord) =>
  [order.ref, order.customer.name, order.trackingNumber ?? ''].join(' ').toLowerCase();

const customerOf = (row: OrderRow) => ({
  name: row.customerName,
  phone: row.customerPhone,
  phone2: row.customerPhone2,
  wilayaCode: row.wilayaCode,
  communeId: row.communeId,
  address: row.address,
});

const lineOf = ({ id, productId, name, sku, quantity, unitPrice, lineTotal }: OrderItemRow) => ({
  id,
  productId,
  name,
  sku,
  quantity,
  unitPrice,
  lineTotal,
});

export function toRecord(row: OrderRowWithItems): OrderRecord {
  return {
    id: row.id,
    storeId: row.storeId,
    ref: row.ref,
    status: OrderStatusSchema.parse(row.status),
    source: OrderSourceSchema.parse(row.source),
    externalRef: row.externalRef,
    customer: customerOf(row),
    items: row.items.map(lineOf),
    deliveryType: DeliveryTypeSchema.parse(row.deliveryType),
    stopDeskId: row.stopDeskId,
    subtotal: row.subtotal,
    shippingFee: row.shippingFee,
    discount: row.discount,
    codAmount: row.codAmount,
    notes: row.notes,
    tags: row.tags,
    assignedAgentId: row.assignedAgentId,
    carrier: row.carrier,
    trackingNumber: row.trackingNumber,
    possibleDuplicateOfId: row.possibleDuplicateOfId,
    itemsFingerprint: row.itemsFingerprint,
    postponedUntil: row.postponedUntil,
    statusChangedAt: row.statusChangedAt,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Columns written on insert and update (not the items, which are replaced separately). */
export function toColumns(order: OrderRecord) {
  return {
    status: order.status,
    customerName: order.customer.name,
    customerPhone: order.customer.phone,
    customerPhone2: order.customer.phone2,
    wilayaCode: order.customer.wilayaCode,
    communeId: order.customer.communeId,
    address: order.customer.address,
    deliveryType: order.deliveryType,
    stopDeskId: order.stopDeskId,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    discount: order.discount,
    codAmount: order.codAmount,
    notes: order.notes,
    tags: [...order.tags],
    assignedAgentId: order.assignedAgentId,
    carrier: order.carrier,
    trackingNumber: order.trackingNumber,
    itemsFingerprint: order.itemsFingerprint,
    searchText: searchTextOf(order),
    postponedUntil: order.postponedUntil,
    statusChangedAt: order.statusChangedAt,
    version: order.version,
    updatedAt: order.updatedAt,
  } satisfies Prisma.OrderUncheckedUpdateInput;
}

export function toItemRows(order: OrderRecord): Prisma.OrderItemCreateManyInput[] {
  return order.items.map((item, position) => ({ ...item, orderId: order.id, position }));
}

/** API shape (contracts OrderSchema). */
export function toOrderDto(order: OrderRecord): Order {
  return {
    id: order.id,
    ref: order.ref,
    status: order.status,
    source: order.source,
    externalRef: order.externalRef,
    customer: order.customer,
    items: order.items.map((item) => ({ ...item })),
    deliveryType: order.deliveryType,
    stopDeskId: order.stopDeskId,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    discount: order.discount,
    codAmount: order.codAmount,
    notes: order.notes,
    tags: [...order.tags],
    assignedAgentId: order.assignedAgentId,
    carrier: order.carrier,
    trackingNumber: order.trackingNumber,
    possibleDuplicateOfId: order.possibleDuplicateOfId,
    postponedUntil: order.postponedUntil?.toISOString() ?? null,
    statusChangedAt: order.statusChangedAt.toISOString(),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}
