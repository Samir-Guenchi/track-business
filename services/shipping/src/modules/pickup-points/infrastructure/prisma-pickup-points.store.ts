import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type {
  PickupParcel,
  PickupParcelState,
  PickupPoint,
  PublicPickup,
} from '@trackecom/contracts';
import type {
  DropCheck,
  HeldParcel,
  PickupPointsStore,
  PointFields,
  PointScope,
} from '../application/pickup-points.ports.js';
import { PickupQueries } from './pickup-queries.js';
import { toParcel, toPoint } from './pickup-rows.js';

const pointWhere = (scope: PointScope) => ({ id: scope.pointId, storeId: scope.storeId });
const parcelWhere = (scope: PointScope, shipmentId: string) => ({
  shipmentId,
  pointId: scope.pointId,
  storeId: scope.storeId,
});
const optional = (fields: PointFields) => ({ lat: fields.lat ?? null, lng: fields.lng ?? null });

@Injectable()
export class PrismaPickupPointsStore extends PickupQueries implements PickupPointsStore {
  async createPoint(storeId: string, fields: PointFields): Promise<string> {
    const id = randomUUID();
    await this.prisma.pickupPoint.create({
      data: { ...fields, ...optional(fields), id, storeId, createdAt: new Date() },
    });
    return id;
  }

  async updatePoint(scope: PointScope, fields: PointFields): Promise<boolean> {
    const data = { ...fields, ...optional(fields) };
    const { count } = await this.prisma.pickupPoint.updateMany({ where: pointWhere(scope), data });
    return count === 1;
  }

  async points(storeId: string, pointId?: string): Promise<PickupPoint[]> {
    const rows = await this.prisma.pickupPoint.findMany({
      where: { storeId, ...(pointId ? { id: pointId } : {}) },
      orderBy: { name: 'asc' },
    });
    const totals = await this.totals(storeId);
    return rows.map((row) => toPoint(row, totals.get(row.id)));
  }

  async dropCheck(scope: PointScope, shipmentId: string): Promise<DropCheck | null> {
    const point = await this.prisma.pickupPoint.findFirst({ where: pointWhere(scope) });
    if (!point) return null;
    const [holding, shipment, existing] = await Promise.all([
      this.prisma.pickupParcel.count({ where: { pointId: point.id, releasedAt: null } }),
      this.prisma.shipment.findFirst({
        where: { id: shipmentId, storeId: scope.storeId },
        select: { status: true },
      }),
      this.prisma.pickupParcel.findUnique({ where: { shipmentId }, select: { pointId: true } }),
    ]);
    return {
      point: { active: point.active, capacity: point.capacity, fee: point.feePerParcel },
      holding,
      shipmentStatus: shipment?.status ?? null,
      alreadyAtPoint: existing !== null,
    };
  }

  async drop(scope: PointScope, parcel: { shipmentId: string; code: string; fee: number }) {
    await this.prisma.pickupParcel.create({
      data: { ...parcel, ...pointRef(scope), droppedAt: new Date() },
    });
  }

  async parcels(scope: PointScope, state?: PickupParcelState): Promise<PickupParcel[]> {
    const released = state ? { releasedAt: state === 'held' ? null : { not: null } } : {};
    const rows = await this.prisma.pickupParcel.findMany({
      where: { pointId: scope.pointId, storeId: scope.storeId, ...released },
      orderBy: { droppedAt: 'desc' },
      take: 200,
    });
    const shipments = await this.shipmentRefs(rows.map((row) => row.shipmentId));
    return rows.flatMap((row) => {
      const shipment = shipments.get(row.shipmentId);
      return shipment ? [toParcel(row, shipment)] : [];
    });
  }

  held(scope: PointScope, shipmentId: string): Promise<HeldParcel | null> {
    return this.prisma.pickupParcel.findFirst({
      where: parcelWhere(scope, shipmentId),
      select: { code: true, failedAttempts: true, releasedAt: true },
    });
  }

  async failedAttempt(scope: PointScope, shipmentId: string): Promise<void> {
    await this.prisma.pickupParcel.updateMany({
      where: parcelWhere(scope, shipmentId),
      data: { failedAttempts: { increment: 1 } },
    });
  }

  async release(scope: PointScope, release: { shipmentId: string; cashCollected: number }) {
    await this.prisma.pickupParcel.updateMany({
      where: { ...parcelWhere(scope, release.shipmentId), releasedAt: null },
      data: { releasedAt: new Date(), cashCollected: release.cashCollected },
    });
  }

  async publicPickup(publicCode: string): Promise<PublicPickup | null> {
    const shipment = await this.prisma.shipment.findUnique({
      where: { publicCode },
      select: { id: true },
    });
    if (!shipment) return null;
    const parcel = await this.prisma.pickupParcel.findUnique({
      where: { shipmentId: shipment.id },
      include: { point: true },
    });
    if (!parcel) return { pickup: null };
    const { name, address, hours, phone, lat, lng } = parcel.point;
    const held = parcel.releasedAt === null;
    const state = held ? 'held' : 'released';
    return {
      pickup: { name, address, hours, phone, lat, lng, state, code: held ? parcel.code : null },
    };
  }
}

function pointRef(scope: PointScope) {
  return { pointId: scope.pointId, storeId: scope.storeId };
}
