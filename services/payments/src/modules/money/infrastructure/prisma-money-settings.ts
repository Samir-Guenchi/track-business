import { Injectable } from '@nestjs/common';
import { type MoneySettings, MoneySettingsSchema } from '@trackecom/contracts';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { MoneySettingsStore } from '../application/ports/money-reads.js';

@Injectable()
export class PrismaMoneySettings implements MoneySettingsStore {
  constructor(private readonly prisma: PrismaService) {}

  async get(storeId: string): Promise<MoneySettings> {
    const row = await this.prisma.moneySettings.findUnique({ where: { storeId } });
    return row ? { missingAfterDays: row.missingAfterDays } : MoneySettingsSchema.parse({});
  }

  async put(storeId: string, settings: MoneySettings): Promise<MoneySettings> {
    const row = await this.prisma.moneySettings.upsert({
      where: { storeId },
      create: { storeId, ...settings },
      update: settings,
    });
    return { missingAfterDays: row.missingAfterDays };
  }
}
