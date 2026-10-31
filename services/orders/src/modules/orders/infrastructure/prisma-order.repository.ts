import { Injectable } from '@nestjs/common';
import { toAuditRow } from '@trackecom/audit';
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
import { OrderConflictError } from '../domain/order.errors.js';
import { orderListFilter } from './order-list.filter.js';
import { toColumns, toItemRows, toRecord, WITH_ITEMS } from './order.mapper.js';

type Tx = Prisma.TransactionClient;

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
            createdAt: order.createdAt,
          },
        });
        await tx.orderItem.createMany({ data: toItemRows(order) });
        await this.writeEffects(tx, effects);
      });
    } catch (error) {
      if (isUniqueViolation(error, 'ref')) throw new RefTakenError();
      throw error;
    }
  }

  async update(order: OrderRecord, effects: OrderEffects): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.writeVersion(tx, order, toColumns(order));
      await tx.orderItem.deleteMany({ where: { orderId: order.id } });
      await tx.orderItem.createMany({ data: toItemRows(order) });
      await this.writeEffects(tx, effects);
    });
  }

  async softDelete(order: OrderRecord, effects: OrderEffects): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const columns = {
        version: order.version,
        updatedAt: order.updatedAt,
        deletedAt: order.updatedAt,
      };
      await this.writeVersion(tx, order, columns);
      await this.writeEffects(tx, effects);
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

  /** Optimistic lock: the row must still be at the version we read. */
  private async writeVersion(
    tx: Tx,
    order: OrderRecord,
    data: Prisma.OrderUncheckedUpdateManyInput,
  ): Promise<void> {
    const { count } = await tx.order.updateMany({
      where: { id: order.id, storeId: order.storeId, version: order.version - 1, deletedAt: null },
      data,
    });
    if (count !== 1) throw new OrderConflictError();
  }

  private async writeEffects(tx: Tx, effects: OrderEffects): Promise<void> {
    const audit = toAuditRow(effects.audit);
    await tx.auditEvent.create({
      data: { ...audit, changes: audit.changes as Prisma.InputJsonValue },
    });
    if (effects.events.length === 0) return;
    await tx.outboxEvent.createMany({
      data: effects.events.map((event) => ({
        ...event,
        payload: event.payload as Prisma.InputJsonValue,
      })),
    });
  }
}
