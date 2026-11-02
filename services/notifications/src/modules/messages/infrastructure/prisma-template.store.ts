import { Injectable } from '@nestjs/common';
import {
  ChannelSchema,
  MessageLanguageSchema,
  NotificationTriggerSchema,
} from '@trackecom/contracts';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { StoredTemplate, TemplateKey, TemplateStore } from '../application/ports/stores.js';

/** Only the key fields: callers may pass a larger object (a queued message). */
const keyOf = ({ trigger, channel, language }: TemplateKey): TemplateKey => ({
  trigger,
  channel,
  language,
});
const id = (storeId: string, key: TemplateKey) => ({
  storeId_trigger_channel_language: { storeId, ...keyOf(key) },
});

@Injectable()
export class PrismaTemplateStore implements TemplateStore {
  constructor(private readonly prisma: PrismaService) {}

  async custom(storeId: string): Promise<StoredTemplate[]> {
    const rows = await this.prisma.notificationTemplate.findMany({ where: { storeId } });
    return rows.map((row) => ({
      trigger: NotificationTriggerSchema.parse(row.trigger),
      channel: ChannelSchema.parse(row.channel),
      language: MessageLanguageSchema.parse(row.language),
      body: row.body,
    }));
  }

  async find(storeId: string, key: TemplateKey): Promise<string | null> {
    const row = await this.prisma.notificationTemplate.findUnique({ where: id(storeId, key) });
    return row?.body ?? null;
  }

  async save(storeId: string, template: StoredTemplate): Promise<void> {
    const { body, ...key } = template;
    const updatedAt = new Date();
    await this.prisma.notificationTemplate.upsert({
      where: id(storeId, key),
      create: { storeId, ...template, updatedAt },
      update: { body, updatedAt },
    });
  }

  async remove(storeId: string, key: TemplateKey): Promise<boolean> {
    const { count } = await this.prisma.notificationTemplate.deleteMany({
      where: { storeId, ...keyOf(key) },
    });
    return count > 0;
  }
}
