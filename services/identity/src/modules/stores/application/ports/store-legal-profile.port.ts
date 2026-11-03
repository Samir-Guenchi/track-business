import type { AuditEntry } from '@trackecom/audit';
import type { StoreLegalProfile } from '@trackecom/contracts';
import type { OutboxMessage } from '../../../../shared/outbox-message.js';
import type { LegalFields } from '../../domain/store-legal-profile.js';

export const STORE_LEGAL_PROFILES = Symbol('StoreLegalProfileRepository');

export interface LegalProfileUpdate {
  readonly storeId: string;
  /** Computes the new fields from the stored profile, read inside the transaction. */
  readonly change: (before: StoreLegalProfile) => LegalFields;
  readonly audit: (before: StoreLegalProfile, after: StoreLegalProfile) => AuditEntry;
  readonly event: (after: StoreLegalProfile) => OutboxMessage;
}

/** One legal profile per store; the update writes its audit entry and event in one transaction. */
export interface StoreLegalProfileRepository {
  get(storeId: string): Promise<StoreLegalProfile>;
  update(update: LegalProfileUpdate): Promise<StoreLegalProfile>;
}
