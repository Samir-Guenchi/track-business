import { Injectable } from '@nestjs/common';
import { type NotificationSettings, NotificationSettingsSchema } from '@trackecom/contracts';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { SettingsStore } from '../application/ports/stores.js';

@Injectable()
export class PrismaSettingsStore implements SettingsStore {
  constructor(private readonly prisma: PrismaService) {}

  async get(storeId: string): Promise<NotificationSettings> {
    const row = await this.prisma.notificationSettings.findUnique({ where: { storeId } });
    // Parsing fills defaults for fields added after the row was saved.
    return NotificationSettingsSchema.parse(row?.settings ?? {});
  }

  async save(storeId: string, settings: NotificationSettings): Promise<void> {
    const data = { settings, updatedAt: new Date() };
    await this.prisma.notificationSettings.upsert({
      where: { storeId },
      create: { storeId, ...data },
      update: data,
    });
  }
}
