import {
  CreateDeliveryRequestSchema,
  type DeliveryRequest,
  DeliveryRequestStateSchema,
  DeliveryTypeSchema,
  ParcelStatusSchema,
  type PublicDeliveryRequest,
} from '@trackecom/contracts';
import type { Prisma } from '../../../generated/prisma/client.js';
import type { TrackedParcel } from '../application/delivery-requests.ports.js';

export const WITH_SHIPMENT = {
  shipment: { select: { orderId: true, carrier: true, trackingNumber: true } },
} as const;
type RowWithShipment = Prisma.DeliveryRequestGetPayload<{ include: typeof WITH_SHIPMENT }>;
type Row = Prisma.DeliveryRequestGetPayload<object>;

export const PARCEL_FIELDS = {
  id: true,
  storeId: true,
  orderId: true,
  carrier: true,
  status: true,
  deliveryType: true,
  toWilayaCode: true,
} as const;
type ParcelRow = Prisma.ShipmentGetPayload<{ select: typeof PARCEL_FIELDS }>;

export const toParcel = (row: ParcelRow): TrackedParcel => ({
  ...row,
  status: ParcelStatusSchema.parse(row.status),
  deliveryType: row.deliveryType === null ? null : DeliveryTypeSchema.parse(row.deliveryType),
});

export const toPublic = (row: Row): PublicDeliveryRequest & { at: Date } => ({
  request: CreateDeliveryRequestSchema.parse(row.details),
  state: DeliveryRequestStateSchema.parse(row.state),
  createdAt: row.createdAt.toISOString(),
  at: row.createdAt,
});

export const toSeller = (row: RowWithShipment): DeliveryRequest => ({
  id: row.id,
  shipmentId: row.shipmentId,
  orderId: row.shipment.orderId,
  carrier: row.shipment.carrier,
  trackingNumber: row.shipment.trackingNumber,
  request: CreateDeliveryRequestSchema.parse(row.details),
  state: DeliveryRequestStateSchema.parse(row.state),
  createdAt: row.createdAt.toISOString(),
  handledAt: row.handledAt?.toISOString() ?? null,
});
