import { Injectable } from '@nestjs/common';
import type { RiskFlag } from '@trackecom/contracts';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { ReturnRiskReads } from '../application/ports/return-risk.reads.js';
import type { ReturnRiskFacts } from '../domain/return-risk.js';

const DAY_MS = 86_400_000;
/** How far back a customer's history and a wilaya's rate are read. */
const CUSTOMER_DAYS = 365;
const WILAYA_DAYS = 180;
const FINISHED = ['delivered', 'returned'];

type Counts = { readonly returned: number; readonly delivered: number };

/** Every query is scoped by the caller's store and uses the store-first indexes. */
@Injectable()
export class PrismaReturnRiskReads implements ReturnRiskReads {
  constructor(private readonly prisma: PrismaService) {}

  async factsFor(
    storeId: string,
    orderId: string,
  ): Promise<(ReturnRiskFacts & { id: string }) | null> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, storeId, deletedAt: null },
    });
    if (!order) return null;
    const now = Date.now();
    const [customer, wilaya] = await Promise.all([
      this.counts(
        { storeId, customerPhone: order.customerPhone, id: { not: order.id } },
        now - CUSTOMER_DAYS * DAY_MS,
      ),
      this.counts({ storeId, wilayaCode: order.wilayaCode }, now - WILAYA_DAYS * DAY_MS),
    ]);
    return {
      id: order.id,
      customer,
      wilaya: { finished: wilaya.returned + wilaya.delivered, returned: wilaya.returned },
      codAmount: order.codAmount,
      createdAt: order.createdAt,
      unreachedCalls: order.unreachedCalls,
      riskFlags: order.riskFlags as RiskFlag[],
      possibleDuplicate: order.possibleDuplicateOfId !== null,
    };
  }

  private async counts(where: object, since: number): Promise<Counts> {
    const groups = await this.prisma.order.groupBy({
      by: ['status'],
      where: {
        ...where,
        status: { in: FINISHED },
        statusChangedAt: { gte: new Date(since) },
        deletedAt: null,
      },
      _count: { _all: true },
    });
    const count = (status: string) =>
      groups.find((group) => group.status === status)?._count._all ?? 0;
    return { returned: count('returned'), delivered: count('delivered') };
  }
}
