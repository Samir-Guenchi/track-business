import { Body, Controller, Get, Inject, Put, Query } from '@nestjs/common';
import {
  type ListParcelMoneyQuery,
  ListParcelMoneyQuerySchema,
  type ListParcelMoneyResponse,
  type MoneySettings,
  MoneySettingsSchema,
  type MoneySummary,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { MoneyQueries } from '../application/money-queries.js';
import {
  MONEY_READS,
  MONEY_SETTINGS,
  type MoneyReads,
  type MoneySettingsStore,
} from '../application/ports/money-reads.js';
import { toParcelMoneyDto } from './parcel.mapper.js';

/** The store's COD money: read by owners, managers and accountants, set by `money.manage`. */
@Controller('money')
export class MoneyController {
  constructor(
    private readonly queries: MoneyQueries,
    @Inject(MONEY_READS) private readonly reads: MoneyReads,
    @Inject(MONEY_SETTINGS) private readonly settings: MoneySettingsStore,
  ) {}

  @Get('summary')
  @RequirePermission('money.read')
  summary(@CurrentStore() store: StoreContext): Promise<MoneySummary> {
    return this.queries.summary(store.storeId);
  }

  /** Where each parcel's money stands; `?status=missing` is the list to claim. */
  @Get('parcels')
  @RequirePermission('money.read')
  async parcels(
    @Query(new ZodValidationPipe(ListParcelMoneyQuerySchema)) query: ListParcelMoneyQuery,
    @CurrentStore() store: StoreContext,
  ): Promise<ListParcelMoneyResponse> {
    const page = await this.reads.listParcels(store.storeId, query);
    return { items: page.items.map(toParcelMoneyDto), nextCursor: page.nextCursor };
  }

  @Get('settings')
  @RequirePermission('money.read')
  getSettings(@CurrentStore() store: StoreContext): Promise<MoneySettings> {
    return this.settings.get(store.storeId);
  }

  @Put('settings')
  @RequirePermission('money.manage')
  putSettings(
    @Body(new ZodValidationPipe(MoneySettingsSchema)) body: MoneySettings,
    @CurrentStore() store: StoreContext,
  ): Promise<MoneySettings> {
    return this.settings.put(store.storeId, body);
  }
}
