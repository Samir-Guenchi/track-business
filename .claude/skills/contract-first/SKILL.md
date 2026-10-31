---
name: contract-first
description: How TrackEcom defines HTTP endpoints and events before implementing them, using zod schemas in packages/contracts and OpenAPI. Use for any endpoint, event or DTO shared across services, web or mobile.
---

# Contract first

Contracts let Samir (services) and Abdennour (web/mobile) build the same feature in parallel without waiting on each other. See rule 3 in `docs/PARALLEL_PLAN.md`.

## Steps

1. **Small contract PR first.** Only files in `packages/contracts/src/<module>/`, merged the same day.
2. **Implement in parallel.** The service implements it; the UI uses MSW mocks generated from the same schemas.
3. **Contract tests** in the service prove responses parse with the schema.

## Layout

```
packages/contracts/src/
  orders/
    order.schema.ts          OrderSchema, OrderStatusSchema
    create-order.schema.ts   CreateOrderRequest / CreateOrderResponse
    list-orders.schema.ts    query + paginated response
    index.ts
  events/
    envelope.schema.ts
    orders.order-confirmed.v1.ts
```

One schema group per file; `index.ts` only re-exports.

## Rules

- zod is the single source of truth. Types are `z.infer<...>`. OpenAPI is generated from zod, not written by hand.
- Requests are **strict** (`.strict()`): unknown fields are rejected. Responses only include fields clients need; never return a DB row as is.
- IDs are strings (UUID v7 or ULID). Dates are ISO 8601 strings in UTC. Money is an integer with currency in the name (`codAmountDzd`).
- Enums are string unions (`'pending' | 'confirmed' | ...`), never numbers.
- Phone numbers validated with the shared Algerian phone schema and normalised to E.164 (`+213...`).
- Lists are cursor paginated: `{ items, nextCursor }`.
- Errors use one shape everywhere: `{ error: { code, message, details? } }`, `code` is a stable string.
- **No breaking changes** to a published contract: add optional fields only. Breaking = new endpoint version or new event version.
- `storeId` never appears in request bodies; it comes from the auth context.

## Review checklist

- [ ] Contract PR contains only `packages/contracts` (and its tests)
- [ ] Request schemas are strict, responses are explicit
- [ ] Event has a version suffix and lives in `events/`
- [ ] No breaking change to an existing schema
