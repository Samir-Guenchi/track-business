import type { AuditEvent } from '@trackecom/contracts';
import type { AuditEntry } from './audit-entry.js';

/**
 * Write side. Call it inside the same database transaction as the change it describes,
 * so an edit without its audit row (or the reverse) cannot happen.
 */
export interface AuditRecorder {
  record(entry: AuditEntry): Promise<void>;
}

export interface AuditTrailQuery {
  /** From the authenticated context only, never from the request. */
  readonly storeId: string;
  readonly entity: string;
  readonly entityId: string;
  readonly cursor?: string;
  readonly limit: number;
}

export interface AuditTrailPage {
  readonly items: readonly AuditEvent[];
  readonly nextCursor: string | null;
}

/** Read side: one record's timeline, newest first. */
export interface AuditTrailReader {
  list(query: AuditTrailQuery): Promise<AuditTrailPage>;
}

export const AUDIT_RECORDER = Symbol('AUDIT_RECORDER');
export const AUDIT_TRAIL_READER = Symbol('AUDIT_TRAIL_READER');
