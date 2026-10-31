# Audit log

Sellers need to know who changed an order, who cancelled it and when. Every service that owns business records keeps its **own** `audit_events` table (database per service, ADR-0001); the shared logic lives in `packages/audit`.

## How a service records an action

1. Copy the `AuditEvent` model from `services/identity/prisma/schema/audit.prisma` into the service's `prisma/schema/audit.prisma` and create its migration.
2. Add a small store like `services/identity/src/modules/audit/prisma-audit.store.ts` (two Prisma calls; the mapping is `toAuditRow` / `toAuditEvent`).
3. In the use case, build the entry with `createAuditEntry({ storeId, entity, entityId, action, actor, before, after, ip })` and call `record(entry, tx)` **inside the same transaction** as the change.

What gets audited (minimum):

| Service | Actions |
|---|---|
| orders (#22) | every status change and every edit (`order.status_changed`, `order.updated`, `order.cancelled`) |
| identity (#17) | role changes, invitations, revocations, ownership transfer |
| payments (#42) | COD adjustments |
| integrations (#57) | API key creation and revocation |

`computeChanges` stores only the fields that changed. Fields that look like secrets (`password`, `token`, `hash`, `otp`, `apiKey`...) are stored as `[redacted]`; phone numbers are masked as `+213****1234`.

## Reading a timeline

`GET /audit?entity=order&id=<orderId>&limit=50&cursor=...` on the owning service (through the gateway), newest first, contract `ListAuditResponseSchema`. `storeId` comes only from the authenticated context; the response never includes the IP address or the store id. Identity exposes it once its store guard lands (#17); orders exposes it with #22.

## Retention

| Data | Kept for | Then |
|---|---|---|
| Audit events | 24 months | deleted |
| IP address on an event | 90 days | set to `null` (law 18-07: personal data, kept only as long as needed for security investigations) |

`retentionCutoffs(now)` computes both dates; each service runs `applyRetention` once a day from its job scheduler. A seller can export a record's full timeline before it expires.
