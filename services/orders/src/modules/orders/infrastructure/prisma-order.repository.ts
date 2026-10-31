import { Injectable } from '@nestjs/common';
import type { ListOrdersQuery, OrderSource } from '@trackecom/contracts';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import {
  type OrderEffects,
  type OrderPage,
  type OrderRepository,
  RefTakenError,
} from '../application/ports/orders.ports.js';
import type { OrderRecord } from '../domain/order.js';
import { orderListFilter } from './order-list.filter.js';
import { writeOrderEffects, writeOrderVersion } from './order-writes.js';
import { toColumns, toItemRows, toRecord, WITH_ITEMS } from './order.mapper.js';

const isUniqueViolation = (error: unknown, field: string) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === 'P2002' &&
  JSON.stringify(error.meta ?? {}).includes(field);

@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(storeId: string, id: string): Promise<OrderRecord | null> {
    const row = await this.prisma.order.findFirst({
      where: { id, storeId, deletedAt: null },
      include: WITH_ITEMS,
    });
    return row ? toRecord(row) : null;
  }

  async findIdByExternalRef(storeId: string, source: OrderSource, externalRef: string) {
    const row = await this.prisma.order.findFirst({
      where: { storeId, source, externalRef, deletedAt: null },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  async findRecentDuplicate(order: OrderRecord, since: Date): Promise<string | null> {
    const row = await this.prisma.order.findFirst({
      where: {
        storeId: order.storeId,
        customerPhone: order.customer.phone,
        itemsFingerprint: order.itemsFingerprint,
        createdAt: { gte: since },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  async insert(order: OrderRecord, effects: OrderEffects): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.order.create({
          data: {
            ...toColumns(order),
            id: order.id,
            storeId: order.storeId,
            ref: order.ref,
            source: order.source,
            externalRef: order.externalRef,
            possibleDuplicateOfId: order.possibleDuplicateOfId,
            riskFlags: [...order.riskFlags],
            createdAt: order.createdAt,
          },
        });
        await tx.orderItem.createMany({ data: toItemRows(order) });
        await writeOrderEffects(tx, effects);
      });
    } catch (error) {
      if (isUniqueViolation(error, 'ref')) throw new RefTakenError();
      throw error;
    }
  }

  async update(order: OrderRecord, effects: OrderEffects): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await writeOrderVersion(tx, order, toColumns(order));
      await tx.orderItem.deleteMany({ where: { orderId: order.id } });
      await tx.orderItem.createMany({ data: toItemRows(order) });
      await writeOrderEffects(tx, effects);
    });
  }

  async softDelete(order: OrderRecord, effects: OrderEffects): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const columns = {
        version: order.version,
        updatedAt: order.updatedAt,
        deletedAt: order.updatedAt,
      };
      await writeOrderVersion(tx, order, columns);
      await writeOrderEffects(tx, effects);
    });
  }

  async list(storeId: string, query: ListOrdersQuery): Promise<OrderPage> {
    const rows = await this.prisma.order.findMany({
      where: orderListFilter(storeId, query),
      include: WITH_ITEMS,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const page = rows.slice(0, query.limit);
    const nextCursor = rows.length > query.limit ? (page.at(-1)?.id ?? null) : null;
    return { items: page.map(toRecord), nextCursor };
  }
}
