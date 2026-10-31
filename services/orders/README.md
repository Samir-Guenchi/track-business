# orders service

Owns orders, their items, their status history and audit trail (ADR-0001, issue #22). Port 4003.

```bash
cp .env.example .env
pnpm --filter @trackecom/orders db:migrate
pnpm --filter @trackecom/orders dev     # http://localhost:4003/docs/openapi.json
```

- Every route needs an access token from identity (`Authorization: Bearer` or the `te_access` cookie) and `x-store-id`. The token is checked against identity's JWKS; the caller's role in the store comes from identity's `GET /stores`, cached in Redis for `ROLE_CACHE_SECONDS` (60 s), so a removed member keeps access for at most that long.
- Status rules: `packages/contracts/src/orders/order-status.ts`, explained in `docs/order-status.md`. Agents set confirmation statuses (`orders.confirm`), packers set shipping statuses (`shipments.manage`).
- Each write runs in one transaction with its audit row and outbox event, and checks a version number so two people cannot overwrite each other (`orders.conflict`).
- Search uses a trigram index, so the database needs the `pg_trgm` extension (created by the first migration).
- Measured on 10,000 orders of one store: status, wilaya and tag filters under 1 ms, text and phone search under 4 ms (database time).
