import { Injectable } from '@nestjs/common';
import type { PickupStatement } from '@trackecom/contracts';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { PointScope } from '../application/pickup-points.ports.js';
import type { PointTotals, ShipmentRef } from './pickup-rows.js';

/** The read-heavy and bulk queries of the pickup points store: totals, handover, statement. */
@Injectable()
export class PickupQueries {
  constructor(protected readonly prisma: PrismaService) {}

  protected async totals(storeId: string): Promise<Map<string, PointTotals>> {
    const [held, cash] = await Promise.all([
      this.prisma.pickupParcel.groupBy({
        by: ['pointId'],
        where: { storeId, releasedAt: null },
        _count: { _all: true },
      }),
      this.prisma.pickupParcel.groupBy({
        by: ['pointId'],
        where: { storeId, releasedAt: { not: null }, handedOverAt: null },
        _sum: { cashCollected: true },
      }),
    ]);
    const totals = new Map<string, PointTotals>();
    for (const row of held) totals.set(row.pointId, { holding: row._count._all, cashToCollect: 0 });
    for (const row of cash) {
      const holding = totals.get(row.pointId)?.holding ?? 0;
      totals.set(row.pointId, { holding, cashToCollect: row._sum.cashCollected ?? 0 });
    }
    return totals;
  }

  protected async shipmentRefs(ids: string[]): Promise<Map<string, ShipmentRef>> {
    const rows = await this.prisma.shipment.findMany({
      where: { id: { in: ids } },
      select: { id: true, orderId: true, trackingNumber: true },
    });
    return new Map(rows.map((row) => [row.id, row]));
  }

  /** One atomic update, so two clicks cannot hand the same cash over twice. */
  async handover(scope: PointScope): Promise<{ parcels: number; amount: number }> {
    const rows = await this.prisma.$queryRaw<{ cash: number | null }[]>(Prisma.sql`
      UPDATE pickup_parcels SET handed_over_at = now()
      WHERE point_id = ${scope.pointId}::uuid AND store_id = ${scope.storeId}::uuid
        AND released_at IS NOT NULL AND handed_over_at IS NULL
      RETURNING cash_collected AS cash`);
    return { parcels: rows.length, amount: rows.reduce((sum, row) => sum + (row.cash ?? 0), 0) };
  }

  async statement(
    scope: PointScope,
    range: { from: Date; to: Date },
  ): Promise<Omit<PickupStatement, 'month'>> {
    const where = { pointId: scope.pointId, storeId: scope.storeId };
    const within = { gte: range.from, lt: range.to };
    const [released, handed] = await Promise.all([
      this.prisma.pickupParcel.aggregate({
        where: { ...where, releasedAt: within },
        _count: { _all: true },
        _sum: { fee: true, cashCollected: true },
      }),
      this.prisma.pickupParcel.aggregate({
        where: { ...where, handedOverAt: within },
        _sum: { cashCollected: true },
      }),
    ]);
    return {
      released: released._count._all,
      fees: released._sum.fee ?? 0,
      cashCollected: released._sum.cashCollected ?? 0,
      cashHandedOver: handed._sum.cashCollected ?? 0,
    };
  }
}
