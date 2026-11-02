import type { LinkRecord } from '../domain/self-confirm.js';

export interface NewLink extends LinkRecord {
  readonly tokenHash: string;
  readonly createdBy: string;
  readonly createdAt: Date;
}

export interface LinkStore {
  save(link: NewLink): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<LinkRecord | null>;
  /** Marks the link used only if it is still unused; false when another answer won. */
  markUsed(id: string, at: Date): Promise<boolean>;
  /** Undoes markUsed when the order could not be changed. */
  unmarkUsed(id: string): Promise<void>;
}

export const LINK_STORE = Symbol('LinkStore');
