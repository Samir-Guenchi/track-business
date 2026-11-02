import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import {
  AlgerianPhoneSchema,
  type NotificationSettings,
  NotificationSettingsSchema,
  type OptOutRequest,
  OptOutRequestSchema,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { NotificationAdminService } from '../application/notification-admin.service.js';

export const PhonePipe = new ZodValidationPipe(AlgerianPhoneSchema);

/** The store's switches (#46): on/off, channel, triggers, quiet hours, and the opt-out list. */
@Controller('notifications')
export class NotificationSettingsController {
  constructor(private readonly admin: NotificationAdminService) {}

  @Get('settings')
  @RequirePermission('store.read')
  get(@CurrentStore() store: StoreContext): Promise<NotificationSettings> {
    return this.admin.settings(store.storeId);
  }

  @Put('settings')
  @RequirePermission('store.update')
  put(
    @Body(new ZodValidationPipe(NotificationSettingsSchema)) body: NotificationSettings,
    @CurrentStore() store: StoreContext,
  ): Promise<NotificationSettings> {
    return this.admin.replaceSettings(store.storeId, body);
  }

  /** An agent records that the customer wants no more messages. */
  @Post('opt-outs')
  @HttpCode(204)
  @RequirePermission('orders.confirm')
  async optOut(
    @Body(new ZodValidationPipe(OptOutRequestSchema)) body: OptOutRequest,
    @CurrentStore() store: StoreContext,
  ): Promise<void> {
    await this.admin.optOut(store.storeId, body.phone);
  }

  @Delete('opt-outs/:phone')
  @HttpCode(204)
  @RequirePermission('store.update')
  async optIn(
    @Param('phone', PhonePipe) phone: string,
    @CurrentStore() store: StoreContext,
  ): Promise<void> {
    await this.admin.optIn(store.storeId, phone);
  }
}
