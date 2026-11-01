import { Module } from '@nestjs/common';
import {
  ADMIN_STORES,
  type AdminStores,
  NotificationAdminService,
} from './application/notification-admin.service.js';
import {
  type MessageReads,
  type OptOutStore,
  type SettingsStore,
  STORES,
} from './application/ports/stores.js';
import { TemplateService } from './application/template.service.js';
import { PrismaMessageReads } from './infrastructure/prisma-message.reads.js';
import { PrismaOptOutStore } from './infrastructure/prisma-opt-out.store.js';
import { PrismaSettingsStore } from './infrastructure/prisma-settings.store.js';
import { PrismaTemplateStore } from './infrastructure/prisma-template.store.js';
import { MessagesController } from './interface/messages.controller.js';
import { NotificationSettingsController } from './interface/notification-settings.controller.js';
import { TemplatesController } from './interface/templates.controller.js';

/** Customer messages (#46): settings, templates, opt-outs and the message log. */
@Module({
  controllers: [NotificationSettingsController, TemplatesController, MessagesController],
  providers: [
    TemplateService,
    NotificationAdminService,
    { provide: STORES.settings, useClass: PrismaSettingsStore },
    { provide: STORES.templates, useClass: PrismaTemplateStore },
    { provide: STORES.optOuts, useClass: PrismaOptOutStore },
    { provide: STORES.messageReads, useClass: PrismaMessageReads },
    {
      provide: ADMIN_STORES,
      inject: [STORES.settings, STORES.optOuts, STORES.messageReads],
      useFactory: (
        settings: SettingsStore,
        optOuts: OptOutStore,
        messages: MessageReads,
      ): AdminStores => ({
        settings,
        optOuts,
        messages,
      }),
    },
  ],
  exports: [TemplateService, STORES.settings, STORES.optOuts],
})
export class MessagesModule {}
