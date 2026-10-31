import type { AuditActor, AuditChange } from '@trackecom/contracts';
import { computeChanges } from './compute-changes.js';

/** What a service stores for one audited action. Always scoped to a store (tenant). */
export interface AuditEntry {
  readonly id: string;
  readonly storeId: string;
  readonly entity: string;
  readonly entityId: string;
  readonly action: string;
  readonly actor: AuditActor;
  readonly changes: readonly AuditChange[];
  readonly ip: string | null;
  readonly occurredAt: Date;
}

export interface AuditInput {
  readonly storeId: string;
  readonly entity: string;
  readonly entityId: string;
  readonly action: string;
  readonly actor: AuditActor;
  readonly before?: Readonly<Record<string, unknown>> | null;
  readonly after?: Readonly<Record<string, unknown>> | null;
  readonly ip?: string | null;
}

export interface AuditDeps {
  readonly newId: () => string;
  readonly now: () => Date;
}

/** Builds the entry (diff + redaction) so every service records audits the same way. */
export function createAuditEntry(input: AuditInput, deps: AuditDeps): AuditEntry {
  return {
    id: deps.newId(),
    storeId: input.storeId,
    entity: input.entity,
    entityId: input.entityId,
    action: input.action,
    actor: input.actor,
    changes: computeChanges(input.before ?? null, input.after ?? null),
    ip: input.ip ?? null,
    occurredAt: deps.now(),
  };
}
