import type { ReconciliationStatus } from '@trackecom/contracts';
import type { OutboxMessage } from '../../../../shared/outbox-message.js';
import type { Account, Posting } from '../../domain/ledger.js';

export interface ParcelRecord {
  readonly id: string;
  readonly storeId: string;
  readonly carrier: string;
  readonly trackingNumber: string;
  readonly orderId: string | null;
  readonly expectedCod: number | null;
  readonly status: ReconciliationStatus;
  readonly deliveredAt: Date | null;
  readonly receivedCod: number | null;
  readonly fees: number;
  readonly payoutId: string | null;
}

export interface ParcelKey {
  readonly storeId: string;
  readonly carrier: string;
  readonly trackingNumber: string;
}

/** One bus event applied once: the inbox row is written with its effects. */
export interface Consumed {
  readonly consumer: string;
  readonly eventId: string;
}

export interface ParcelChange {
  readonly parcel: ParcelRecord;
  /** The status the parcel had when read; null creates it. */
  readonly previousStatus: ReconciliationStatus | null;
  readonly postings: readonly Posting[];
  readonly outbox: readonly OutboxMessage[];
  readonly consumed: Consumed;
}

export interface MoneyRepository {
  findParcel(key: ParcelKey): Promise<ParcelRecord | null>;
  /**
   * Upserts the parcel, writes its postings (one balanced ledger entry) and outbox rows, and
   * records the event as consumed, in one transaction. false when the event was already applied.
   */
  saveParcel(change: ParcelChange): Promise<boolean>;
  balances(storeId: string): Promise<Partial<Record<Account, number>>>;
  countParcels(storeId: string, statuses: readonly ReconciliationStatus[]): Promise<number>;
}

export const MONEY_REPOSITORY = Symbol('MoneyRepository');
