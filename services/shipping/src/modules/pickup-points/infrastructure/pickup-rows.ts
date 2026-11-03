import type { PickupParcel, PickupPoint } from '@trackecom/contracts';

export interface PointRow {
  readonly id: string;
  readonly name: string;
  readonly wilayaCode: number;
  readonly communeId: number;
  readonly address: string;
  readonly phone: string;
  readonly hours: string;
  readonly lat: number | null;
  readonly lng: number | null;
  readonly capacity: number;
  readonly feePerParcel: number;
  readonly active: boolean;
}

export interface PointTotals {
  readonly holding: number;
  readonly cashToCollect: number;
}

export const toPoint = (row: PointRow, totals: PointTotals | undefined): PickupPoint => ({
  id: row.id,
  name: row.name,
  wilayaCode: row.wilayaCode,
  communeId: row.communeId,
  address: row.address,
  phone: row.phone,
  hours: row.hours,
  lat: row.lat,
  lng: row.lng,
  capacity: row.capacity,
  feePerParcel: row.feePerParcel,
  active: row.active,
  holding: totals?.holding ?? 0,
  cashToCollect: totals?.cashToCollect ?? 0,
});

export interface ParcelRow {
  readonly shipmentId: string;
  readonly droppedAt: Date;
  readonly releasedAt: Date | null;
  readonly cashCollected: number | null;
  readonly handedOverAt: Date | null;
}

export interface ShipmentRef {
  readonly orderId: string;
  readonly trackingNumber: string;
}

export const toParcel = (row: ParcelRow, shipment: ShipmentRef): PickupParcel => ({
  shipmentId: row.shipmentId,
  orderId: shipment.orderId,
  trackingNumber: shipment.trackingNumber,
  state: row.releasedAt ? 'released' : 'held',
  droppedAt: row.droppedAt.toISOString(),
  releasedAt: row.releasedAt?.toISOString() ?? null,
  cashCollected: row.cashCollected,
  handedOverAt: row.handedOverAt?.toISOString() ?? null,
});
