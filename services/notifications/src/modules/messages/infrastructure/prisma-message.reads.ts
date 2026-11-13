import { Injectable } from '@nestjs/common';
import type { ListMessagesQuery, UsageResponse } from '@trackecom/contracts';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { MessageReads, MessageRecord } from '../application/ports/stores.js';
import { toMessageRecord } from './message-rows.js';

/** Store-scoped reads; newest first, paged by id after the cursor row. */
@Injectable()
export class PrismaMessageReads implements MessageReads {
  constructor(private readonly prisma: PrismaService) {}

  async list(storeId: string, query: ListMessagesQuery) {
    const rows = await this.prisma.message.findMany({
      where: {
        storeId,
        ...(query.orderId ? { orderId: query.orderId } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: [{ queuedAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const items: MessageRecord[] = rows.slice(0, query.limit).map(toMessageRecord);
    const nextCursor = rows.length > query.limit ? (items.at(-1)?.id ?? null) : null;
    return { items, nextCursor };
  }

  async usage(
    storeId: string,
    range: { from: Date; to: Date },
  ): Promise<Omit<UsageResponse, 'month'>> {
    const groups = await this.prisma.message.groupBy({
      by: ['status'],
      where: { storeId, queuedAt: { gte: range.from, lt: range.to } },
      _count: { _all: true },
      _sum: { costCentimes: true },
    });
    const count = (status: string) =>
      groups.find((group) => group.status === status)?._count._all ?? 0;
    const centimes = groups.reduce((sum, group) => sum + (group._sum.costCentimes ?? 0), 0);
    return {
      sent: count('sent') + count('delivered'),
      delivered: count('delivered'),
      failed: count('failed'),
      costDzd: centimes / 100,
    };
  }
}
