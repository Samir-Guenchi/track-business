import { Controller, Get } from '@nestjs/common';
import type { MoneySummary } from '@trackecom/contracts';
import { CurrentStore, RequirePermission, type StoreContext } from '@trackecom/service-kit';
import { MoneyQueries } from '../application/money-queries.js';

/** The store's COD money, for owners, managers and accountants (`money.read`). */
@Controller('money')
export class MoneyController {
  constructor(private readonly queries: MoneyQueries) {}

  @Get('summary')
  @RequirePermission('money.read')
  summary(@CurrentStore() store: StoreContext): Promise<MoneySummary> {
    return this.queries.summary(store.storeId);
  }
}
