import { z } from 'zod';
import { cursorPage } from '../common/pagination.schema.js';

/** What was touched: `order`, `membership`, `api_key`... lower snake case. */
export const AuditEntitySchema = z.string().regex(/^[a-z][a-z_]{1,39}$/);

/** `<entity>.<past-tense verb>`, e.g. `order.status_changed`, `membership.role_changed`. */
export const AuditActionSchema = z.string().regex(/^[a-z_]+\.[a-z_]+$/);

export const AuditActorSchema = z.strictObject({
  type: z.enum(['user', 'system', 'api_key']),
  id: z.string().min(1),
});

/** One changed field. Sensitive fields are stored as "[redacted]". */
export const AuditChangeSchema = z.strictObject({
  field: z.string().min(1),
  before: z.unknown(),
  after: z.unknown(),
});

export const AuditEventSchema = z.strictObject({
  id: z.string().min(1),
  entity: AuditEntitySchema,
  entityId: z.string().min(1),
  action: AuditActionSchema,
  actor: AuditActorSchema,
  changes: z.array(AuditChangeSchema),
  occurredAt: z.iso.datetime(),
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;
export type AuditActor = z.infer<typeof AuditActorSchema>;
export type AuditChange = z.infer<typeof AuditChangeSchema>;

/** `GET /audit?entity=order&id=...`: the timeline of one record, newest first. */
export const ListAuditQuerySchema = z.strictObject({
  entity: AuditEntitySchema,
  id: z.string().min(1).max(64),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ListAuditQuery = z.infer<typeof ListAuditQuerySchema>;

export const ListAuditResponseSchema = cursorPage(AuditEventSchema);
export type ListAuditResponse = z.infer<typeof ListAuditResponseSchema>;
