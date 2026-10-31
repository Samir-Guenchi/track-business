import { type AuditEvent, AuditActorSchema, AuditChangeSchema } from '@trackecom/contracts';
import type { AuditEntry } from './audit-entry.js';

/**
 * Column layout of the `audit_events` table every service copies into its own Prisma schema
 * (see docs/audit-log.md). Keeping the mapping here means services only write two Prisma calls.
 */
export interface AuditRow {
  id: string;
  storeId: string;
  entity: string;
  entityId: string;
  action: string;
  actorType: string;
  actorId: string;
  changes: unknown;
  ip: string | null;
  occurredAt: Date;
}

export function toAuditRow(entry: AuditEntry): AuditRow {
  return {
    id: entry.id,
    storeId: entry.storeId,
    entity: entry.entity,
    entityId: entry.entityId,
    action: entry.action,
    actorType: entry.actor.type,
    actorId: entry.actor.id,
    changes: entry.changes,
    ip: entry.ip,
    occurredAt: entry.occurredAt,
  };
}

/** The public shape: no `storeId` (implied by the caller) and no IP address (personal data). */
export function toAuditEvent(row: AuditRow): AuditEvent {
  return {
    id: row.id,
    entity: row.entity,
    entityId: row.entityId,
    action: row.action,
    actor: AuditActorSchema.parse({ type: row.actorType, id: row.actorId }),
    changes: AuditChangeSchema.array().parse(row.changes),
    occurredAt: row.occurredAt.toISOString(),
  };
}
