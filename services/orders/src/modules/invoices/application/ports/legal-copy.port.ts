import type { StoreLegalProfile } from '@trackecom/contracts';

export const LEGAL_COPIES = Symbol('LegalCopyRepository');

/** Orders' copy of each store's legal profile, the one printed on invoices. */
export interface LegalCopyRepository {
  /** Saves the profile unless a copy from a later change is already stored; true when saved. */
  save(storeId: string, profile: StoreLegalProfile, sourceAt: Date): Promise<boolean>;
  find(storeId: string): Promise<StoreLegalProfile | null>;
}
