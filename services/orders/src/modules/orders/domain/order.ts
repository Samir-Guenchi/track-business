import type {
  DeliveryType,
  OrderSource,
  OrderStatus,
  Permission,
  RiskFlag,
} from '@trackecom/contracts';

export interface OrderLine {
  readonly id: string;
  readonly productId: string | null;
  readonly name: string;
  readonly sku: string | null;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly lineTotal: number;
}

export interface OrderCustomer {
  readonly name: string;
  readonly phone: string;
  readonly phone2: string | null;
  readonly wilayaCode: number;
  readonly communeId: number;
  readonly address: string | null;
}

/** An order as the application sees it; persistence details (search text...) stay outside. */
export interface OrderRecord {
  readonly id: string;
  readonly storeId: string;
  readonly ref: string;
  readonly status: OrderStatus;
  readonly source: OrderSource;
  readonly externalRef: string | null;
  readonly customer: OrderCustomer;
  readonly items: readonly OrderLine[];
  readonly deliveryType: DeliveryType;
  readonly stopDeskId: string | null;
  readonly subtotal: number;
  readonly shippingFee: number;
  readonly discount: number;
  readonly codAmount: number;
  readonly notes: string | null;
  readonly tags: readonly string[];
  readonly assignedAgentId: string | null;
  readonly carrier: string | null;
  readonly trackingNumber: string | null;
  readonly possibleDuplicateOfId: string | null;
  /** Fake-order signals found when the order came in (#52). */
  readonly riskFlags: readonly RiskFlag[];
  readonly itemsFingerprint: string;
  readonly postponedUntil: Date | null;
  readonly statusChangedAt: Date;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

const CONFIRMATION: readonly OrderStatus[] = [
  'to_confirm',
  'confirmed',
  'cancelled',
  'unreachable',
  'postponed',
];

/** Agents confirm, packers and carriers ship: who may set each status (docs/permissions.md). */
export function permissionToSet(status: OrderStatus): Permission {
  return CONFIRMATION.includes(status) ? 'orders.confirm' : 'shipments.manage';
}

/** Fields shown in the audit trail; the phone is masked by @trackecom/audit. */
export function auditSnapshot(order: OrderRecord): Record<string, unknown> {
  return {
    status: order.status,
    customerName: order.customer.name,
    customerPhone: order.customer.phone,
    wilayaCode: order.customer.wilayaCode,
    communeId: order.customer.communeId,
    deliveryType: order.deliveryType,
    items: order.items.map((item) => `${item.quantity} x ${item.name}`).join(', '),
    codAmount: order.codAmount,
    shippingFee: order.shippingFee,
    discount: order.discount,
    tags: order.tags.join(','),
    assignedAgentId: order.assignedAgentId,
  };
}
