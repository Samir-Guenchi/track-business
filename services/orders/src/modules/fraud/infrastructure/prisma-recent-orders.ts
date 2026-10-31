import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { RecentOrders } from '../application/ports/fraud.ports.js';

/** Uses the (store, phone, created_at) index the duplicate check already relies on. */
@Injectable()
export class PrismaRecentOrders implements RecentOrders {
  constructor(private readonly prisma: PrismaService) {}

  countByPhone(storeId: string, phone: string, since: Date): Promise<number> {
    return this.prisma.order.count({
      where: { storeId, customerPhone: phone, createdAt: { gte: since }, deletedAt: null },
    });
  }
}
