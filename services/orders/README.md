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

## Confirmation centre (#28)

| Endpoint | Who | |
|---|---|---|
| `GET /confirmation/next` | `orders.confirm` | takes the next order and locks it to the agent for 5 minutes |
| `POST /confirmation/calls` | `orders.confirm` | logs the outcome of a call on an order the agent holds, then frees it |
| `POST /confirmation/orders/:id/release` | `orders.confirm` | gives an order back without a call |
| `GET` / `PUT /confirmation/settings` | `store.read` / `store.update` | assignment (round robin or per-agent wilayas/products), attempts per day, unreachable limit |

- Queue order: the order the agent already holds, then due call-backs and postponed orders (earliest first), then the oldest `new` / `to_confirm` order. Orders that reached today's attempt limit wait for the next day (Algiers time).
- One `UPDATE ... WHERE id = (SELECT ... FOR UPDATE SKIP LOCKED)` picks and locks the order, so two agents never get the same one, even on several replicas.
- `no_answer` and `busy` count towards `unreachableAfter`; at the limit the order becomes `unreachable`. A wrong number ends as `unreachable` too.
- Every call is an audit entry (`call_logged` in the order history) and a `orders.call.logged.v1` event.
