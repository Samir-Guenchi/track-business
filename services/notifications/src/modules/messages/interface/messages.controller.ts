import { Controller, Get, Query } from '@nestjs/common';
import {
  type ListMessagesQuery,
  ListMessagesQuerySchema,
  type ListMessagesResponse,
  UsageQuerySchema,
  type UsageResponse,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { NotificationAdminService } from '../application/notification-admin.service.js';
import { toMessageDto } from './message.mapper.js';

/** What was sent to customers, and what it cost the store (#46). */
@Controller('notifications')
export class MessagesController {
  constructor(private readonly admin: NotificationAdminService) {}

  @Get('messages')
  @RequirePermission('orders.read')
  async list(
    @Query(new ZodValidationPipe(ListMessagesQuerySchema)) query: ListMessagesQuery,
    @CurrentStore() store: StoreContext,
  ): Promise<ListMessagesResponse> {
    const page = await this.admin.messages(store.storeId, query);
    return { items: page.items.map(toMessageDto), nextCursor: page.nextCursor };
  }

  @Get('usage')
  @RequirePermission('money.read')
  usage(
    @Query(new ZodValidationPipe(UsageQuerySchema)) query: { month: string },
    @CurrentStore() store: StoreContext,
  ): Promise<UsageResponse> {
    return this.admin.usage(store.storeId, query.month);
  }
}
