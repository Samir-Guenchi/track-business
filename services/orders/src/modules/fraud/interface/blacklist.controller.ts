import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import {
  type BlacklistEntry,
  CreateBlacklistEntryRequestSchema,
  type ListBlacklistQuery,
  ListBlacklistQuerySchema,
  type ListBlacklistResponse,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { z } from 'zod';
import { BlacklistUseCases } from '../application/blacklist.use-cases.js';

export const EntryIdPipe = new ZodValidationPipe(z.uuid());

/** The store's blacklist (#52): read by anyone who sees orders, edited by `orders.write`. */
@Controller('blacklist')
export class BlacklistController {
  constructor(private readonly blacklist: BlacklistUseCases) {}

  @Post()
  @RequirePermission('orders.write')
  add(
    @Body(new ZodValidationPipe(CreateBlacklistEntryRequestSchema))
    body: z.output<typeof CreateBlacklistEntryRequestSchema>,
    @CurrentStore() store: StoreContext,
  ): Promise<BlacklistEntry> {
    return this.blacklist.add(store, body);
  }

  @Get()
  @RequirePermission('orders.read')
  list(
    @Query(new ZodValidationPipe(ListBlacklistQuerySchema)) query: ListBlacklistQuery,
    @CurrentStore() store: StoreContext,
  ): Promise<ListBlacklistResponse> {
    return this.blacklist.list(store.storeId, query);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('orders.write')
  async remove(@Param('id', EntryIdPipe) id: string, @CurrentStore() store: StoreContext) {
    await this.blacklist.remove(store.storeId, id);
  }
}
