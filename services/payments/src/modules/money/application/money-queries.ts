import { Inject, Injectable } from '@nestjs/common';
import { FLAGGED_STATUSES, type MoneySummary } from '@trackecom/contracts';
import { summarize } from '../domain/ledger.js';
import { MONEY_REPOSITORY, type MoneyRepository } from './ports/money.repository.js';

@Injectable()
export class MoneyQueries {
  constructor(@Inject(MONEY_REPOSITORY) private readonly money: MoneyRepository) {}

  async summary(storeId: string): Promise<MoneySummary> {
    const [balances, flagged] = await Promise.all([
      this.money.balances(storeId),
      this.money.countParcels(storeId, FLAGGED_STATUSES),
    ]);
    return summarize(balances, flagged);
  }
}
