import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type {
  Reseller,
  ResellerOrder,
  ResellerPayoutResponse,
  ResellerProduct,
  ResellerStats,
} from '@trackecom/contracts';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type {
  PortalReseller,
  ProductFields,
  ResellerFields,
  ResellerScope,
  ResellersStore,
} from '../application/resellers.ports.js';
import {
  type OrderRow,
  ordersSql,
  payoutSql,
  type StatsRow,
  statsSql,
  toOrder,
  toStats,
} from './reseller-sql.js';

const product = (row: ResellerProduct): ResellerProduct => ({
  id: row.id,
  name: row.name,
  supplierPrice: row.supplierPrice,
  minPrice: row.minPrice,
  active: row.active,
});
const productData = (fields: ProductFields) => ({ ...fields, minPrice: fields.minPrice ?? null });

@Injectable()
export class PrismaResellersStore implements ResellersStore {
  constructor(private readonly prisma: PrismaService) {}

  async resellers(storeId: string): Promise<Reseller[]> {
    const [rows, stats] = await Promise.all([
      this.prisma.reseller.findMany({ where: { storeId }, orderBy: { name: 'asc' } }),
      this.prisma.$queryRaw<StatsRow[]>(statsSql(storeId)),
    ]);
    const byReseller = new Map(stats.map((row) => [row.resellerId, row]));
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      active: row.active,
      portalCode: row.portalCode,
      stats: toStats(byReseller.get(row.id)),
    }));
  }

  async createReseller(storeId: string, fields: ResellerFields & { portalCode: string }) {
    await this.prisma.reseller.create({
      data: { ...fields, id: randomUUID(), storeId, createdAt: new Date() },
    });
  }

  async updateReseller(scope: ResellerScope, fields: ResellerFields): Promise<boolean> {
    const { count } = await this.prisma.reseller.updateMany({
      where: { id: scope.resellerId, storeId: scope.storeId },
      data: fields,
    });
    return count === 1;
  }

  async catalogue(storeId: string): Promise<ResellerProduct[]> {
    const rows = await this.prisma.resellerProduct.findMany({
      where: { storeId },
      orderBy: { name: 'asc' },
    });
    return rows.map(product);
  }

  async createProduct(storeId: string, fields: ProductFields): Promise<ResellerProduct> {
    const data = { ...productData(fields), id: randomUUID(), storeId, createdAt: new Date() };
    return product(await this.prisma.resellerProduct.create({ data }));
  }

  async updateProduct(scope: { storeId: string; productId: string }, fields: ProductFields) {
    const where = { id: scope.productId, storeId: scope.storeId };
    const { count } = await this.prisma.resellerProduct.updateMany({
      where,
      data: productData(fields),
    });
    if (count !== 1) return null;
    const row = await this.prisma.resellerProduct.findFirst({ where });
    return row ? product(row) : null;
  }

  async orders(scope: ResellerScope): Promise<ResellerOrder[]> {
    const rows = await this.prisma.$queryRaw<OrderRow[]>(
      ordersSql(scope.storeId, scope.resellerId),
    );
    return rows.map(toOrder);
  }

  async stats(scope: ResellerScope): Promise<ResellerStats> {
    const [row] = await this.prisma.$queryRaw<StatsRow[]>(
      statsSql(scope.storeId, scope.resellerId),
    );
    return toStats(row);
  }

  async payout(scope: ResellerScope): Promise<ResellerPayoutResponse> {
    const rows = await this.prisma.$queryRaw<{ margin: number }[]>(
      payoutSql(scope.storeId, scope.resellerId),
    );
    return { orders: rows.length, amount: rows.reduce((sum, row) => sum + row.margin, 0) };
  }

  async byPortalCode(portalCode: string): Promise<PortalReseller | null> {
    const row = await this.prisma.reseller.findUnique({ where: { portalCode } });
    if (!row) return null;
    return { storeId: row.storeId, resellerId: row.id, name: row.name, active: row.active };
  }

  ordersSince(scope: ResellerScope, since: Date): Promise<number> {
    return this.prisma.resellerOrder.count({
      where: { resellerId: scope.resellerId, createdAt: { gte: since } },
    });
  }

  async link(scope: ResellerScope, order: { orderId: string; margin: number }): Promise<void> {
    await this.prisma.resellerOrder.create({
      data: {
        ...order,
        storeId: scope.storeId,
        resellerId: scope.resellerId,
        createdAt: new Date(),
      },
    });
  }
}
