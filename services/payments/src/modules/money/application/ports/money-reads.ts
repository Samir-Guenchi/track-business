import type { ListParcelMoneyQuery, ListPayoutsQuery, MoneySettings } from '@trackecom/contracts';
import type { OutboxMessage } from '../../../../shared/outbox-message.js';
import type { ParcelRecord } from './money.repository.js';
import type { PayoutRecord } from './payout.repository.js';

export interface Page<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
}

export interface MoneyReads {
  listParcels(storeId: string, query: ListParcelMoneyQuery): Promise<Page<ParcelRecord>>;
  listPayouts(storeId: string, query: ListPayoutsQuery): Promise<Page<PayoutRecord>>;
}

export interface MoneySettingsStore {
  /** The store's settings, or the defaults when it never saved any. */
  get(storeId: string): Promise<MoneySettings>;
  put(storeId: string, settings: MoneySettings): Promise<MoneySettings>;
}

export interface OverdueParcels {
  /**
   * Moves up to `limit` delivered parcels unpaid for longer than their store's
   * `missingAfterDays` to `missing`, with the events `outbox` builds, in one transaction.
   * Returns how many moved.
   */
  flagMissing(input: {
    limit: number;
    outbox: (parcels: readonly ParcelRecord[]) => OutboxMessage[];
  }): Promise<number>;
}

export const MONEY_READS = Symbol('MoneyReads');
export const MONEY_SETTINGS = Symbol('MoneySettingsStore');
export const OVERDUE_PARCELS = Symbol('OverdueParcels');
