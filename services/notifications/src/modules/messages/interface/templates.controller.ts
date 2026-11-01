import { Body, Controller, Delete, Get, HttpCode, Param, Put } from '@nestjs/common';
import {
  ChannelSchema,
  type ListTemplatesResponse,
  MessageLanguageSchema,
  type NotificationTemplate,
  NotificationTriggerSchema,
  type UpdateTemplateRequest,
  UpdateTemplateRequestSchema,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { z } from 'zod';
import type { TemplateKey } from '../application/ports/stores.js';
import { TemplateService } from '../application/template.service.js';

const KeyPipe = new ZodValidationPipe(
  z.strictObject({
    trigger: NotificationTriggerSchema,
    channel: ChannelSchema,
    language: MessageLanguageSchema,
  }),
);
const KEY = ':trigger/:channel/:language';

/** Message texts per trigger, channel and language (#46). */
@Controller('notifications/templates')
export class TemplatesController {
  constructor(private readonly templates: TemplateService) {}

  @Get()
  @RequirePermission('store.read')
  async list(@CurrentStore() store: StoreContext): Promise<ListTemplatesResponse> {
    return { items: await this.templates.list(store.storeId) };
  }

  @Put(KEY)
  @RequirePermission('store.update')
  save(
    @Param(KeyPipe) key: TemplateKey,
    @Body(new ZodValidationPipe(UpdateTemplateRequestSchema)) body: UpdateTemplateRequest,
    @CurrentStore() store: StoreContext,
  ): Promise<NotificationTemplate> {
    return this.templates.save(store.storeId, { ...key, body: body.body });
  }

  @Delete(KEY)
  @HttpCode(204)
  @RequirePermission('store.update')
  async reset(
    @Param(KeyPipe) key: TemplateKey,
    @CurrentStore() store: StoreContext,
  ): Promise<void> {
    await this.templates.reset(store.storeId, key);
  }
}
