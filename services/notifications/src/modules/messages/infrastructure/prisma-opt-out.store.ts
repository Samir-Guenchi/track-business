import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { OptOutStore } from '../application/ports/stores.js';

@Injectable()
export class PrismaOptOutStore implements OptOutStore {
  constructor(private readonly prisma: PrismaService) {}

  async add(storeId: string, phone: string): Promise<void> {
    await this.prisma.optOut.upsert({
      where: { storeId_phone: { storeId, phone } },
      create: { storeId, phone, createdAt: new Date() },
      update: {},
    });
  }

  async remove(storeId: string, phone: string): Promise<boolean> {
    const { count } = await this.prisma.optOut.deleteMany({ where: { storeId, phone } });
    return count > 0;
  }

  async has(storeId: string, phone: string): Promise<boolean> {
    return (await this.prisma.optOut.count({ where: { storeId, phone } })) > 0;
  }
}
