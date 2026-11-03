import type { AuditEntry } from '@trackecom/audit';
import type { StoreProfile } from '@trackecom/contracts';
import type { OutboxMessage } from '../../../../shared/outbox-message.js';

export const STORE_PROFILES = Symbol('StoreProfileRepository');

export type ProfileFields = Omit<StoreProfile, 'updatedAt' | 'logoUrl'>;

export interface ProfileUpdate {
  readonly storeId: string;
  /** Computes the new fields from the stored profile, read inside the transaction. */
  readonly change: (before: StoreProfile) => ProfileFields;
  readonly audit: (before: StoreProfile, after: StoreProfile) => AuditEntry;
  readonly event: (after: StoreProfile) => OutboxMessage;
}

/** One profile per store; the update writes its audit entry and event in the same transaction. */
export interface StoreProfileRepository {
  get(storeId: string): Promise<StoreProfile>;
  update(update: ProfileUpdate): Promise<StoreProfile>;
}
