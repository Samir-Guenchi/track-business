import type { PayoutLineInput, PayoutStatus } from '@trackecom/contracts';
import type { OutboxMessage } from '../../../../shared/outbox-message.js';
import type { Reconciliation, StatementTotals } from '../../domain/payout-statement.js';
import type { ParcelRecord } from './money.repository.js';

export interface PayoutRecord {
  readonly id: string;
  readonly storeId: string;
  readonly status: PayoutStatus;
  readonly carrier: string;
  readonly reference: string;
  readonly paidAt: Date;
  readonly totalAmount: number;
  readonly codAmount: number;
  readonly fees: number;
  readonly lineCount: number;
  readonly matched: number;
  readonly flagged: number;
  readonly importedAt: Date;
}

export interface NewPayout {
  readonly id: string;
  readonly storeId: string;
  readonly carrier: string;
  readonly reference: string;
  readonly paidAt: Date;
  readonly totalAmount: number;
  readonly totals: StatementTotals;
  readonly lines: readonly PayoutLineInput[];
}

/** A statement a worker leased for matching. */
export interface ClaimedPayout {
  readonly id: string;
  readonly storeId: string;
  readonly carrier: string;
  readonly reference: string;
  readonly paidAt: Date;
  readonly totalAmount: number;
  readonly lines: readonly PayoutLineInput[];
}

export interface PayoutCompletion {
  readonly payout: ClaimedPayout;
  readonly reconciliation: Reconciliation;
  readonly outbox: readonly OutboxMessage[];
}

export interface PayoutRepository {
  /** Throws PayoutAlreadyImportedError for a second (store, carrier, reference). */
  create(payout: NewPayout): Promise<PayoutRecord>;
  find(storeId: string, id: string): Promise<PayoutRecord | null>;
  /** Leases the oldest statement still processing, or null when there is none. */
  claimNext(leaseMs: number): Promise<ClaimedPayout | null>;
  /** Gives a leased statement back, to be matched again at once. */
  release(payoutId: string): Promise<void>;
  findParcels(payout: ClaimedPayout): Promise<ParcelRecord[]>;
  /**
   * Writes every parcel, ledger entry and event and marks the statement reconciled, in one
   * transaction. Throws ParcelChangedError when a parcel moved since it was read.
   */
  complete(completion: PayoutCompletion): Promise<void>;
}

export const PAYOUT_REPOSITORY = Symbol('PayoutRepository');
