---
name: service-architecture
description: TrackEcom microservices architecture - service boundaries, data ownership, sync vs async communication, events, outbox, scaling and resilience. Use when adding a feature, module or service, deciding where code lives, or touching inter-service calls.
---

# Service architecture

The decision record is `docs/adr/0001-architecture-and-stack.md`. This skill is the day-to-day version.

## Services and what they own

| Service | Owns (data + rules) | Issues |
|---|---|---|
| `gateway` | Nothing persistent. Auth check, rate limits, CORS, routing, response shaping for web/mobile | #12 |
| `identity` | Users, sessions, stores (tenants), memberships, roles | #15, #17 |
| `orders` | Orders, items, statuses, history, products, imports, confirmation calls | #22-#29 |
| `shipping` | Shipments, carrier accounts, labels, tracking events, delivery prices, wilayas/communes | #19, #30-#35 |
| `notifications` | In-app, SMS, WhatsApp, email messages and templates | #37, #46 |
| later: `payments`, `risk`, `analytics`, `integrations` | COD/wallet, risk score + blacklist, reporting, store connectors | Phase 2-4 |

Before adding a new service, check whether the capability fits an existing one. A new service needs a short ADR. Split a service only when it has its own data, its own team rhythm or its own scaling need.

## Where does my code go?

1. Which business capability owns the **data** it changes? That service.
2. Only reads data from another service? Keep a local read model fed by events, or call its API. Never its database.
3. Pure, shared logic with no I/O (formatting a phone, wilaya list)? A package in `packages/`.
4. Shared types, request/response shapes, event payloads? `packages/contracts`.

## Data ownership

- One Postgres database (or schema plus its own DB user) per service. Its Prisma schema lives in `services/<name>/prisma/`.
- Only the owning service has credentials to its tables. No cross-service joins, no shared tables.
- Reference other entities by ID only (`orderId`, `storeId`). Copy the few fields you need via events.
- Every tenant table has `storeId` and an index starting with it.

## Communication

| Need | Use |
|---|---|
| Web/mobile -> backend | HTTPS to `gateway` only. Services are never exposed publicly. |
| Need an answer now (validate a store, price a shipment) | Internal HTTP via a typed client from `packages/contracts`, with timeout (2s default), retry with backoff on idempotent calls, circuit breaker |
| Something happened (order confirmed, parcel delivered) | Domain event through `packages/events` |
| Slow or retryable work (carrier API, SMS, import) | BullMQ job inside the owning service |

Prefer events. A chain of synchronous calls across 3+ services is a design smell.

## Events

- Name: `<service>.<entity>.<past-tense-verb>.v<N>` e.g. `shipping.parcel.delivered.v1`.
- Envelope: `{ id, type, occurredAt, storeId, correlationId, data }`; `data` is a zod schema in `packages/contracts/src/events/`.
- **Outbox pattern**: write the event to an `outbox` table in the same DB transaction as the state change; a relay publishes it. Never publish then commit (or commit then publish) separately.
- **Idempotent consumers**: store processed event `id`s; handling the same event twice must be safe.
- Breaking change = new version (`.v2`), publish both until all consumers move.

## Scalability and resilience

- Stateless processes: no in-memory sessions or caches that must be shared. Use Redis.
- Horizontal scaling: any service runs N replicas; jobs use BullMQ concurrency, not cron on one box.
- Cursor pagination for lists (`?cursor=&limit=`, max 100). No unbounded `findMany`.
- Index for every query you add; check the plan on large tables.
- Cache read-heavy reference data (wilayas, prices) with explicit TTL and invalidation by event.
- Timeouts on every outbound call; retries only for idempotent operations; dead-letter queue after N attempts.
- Health endpoints: `/health/live` (process up) and `/health/ready` (DB/Redis reachable).
- Graceful shutdown: stop accepting, finish in-flight work, close connections.

## Observability

- Structured JSON logs (pino) with `service`, `correlationId`, `storeId`. Never log PII (see secure-coding).
- Propagate `x-correlation-id` from gateway through HTTP calls and event envelopes.
- OpenTelemetry traces and metrics; every queue exposes depth and failure count.

## Configuration

- 12-factor: all config from environment variables, validated by a zod schema at startup; crash early if invalid.
- Each service has `.env.example` with every variable and no real values.

## New service checklist

- [ ] ADR explaining why it is a separate service
- [ ] `services/<name>/` from the template (layers, health, config, Dockerfile, `.env.example`)
- [ ] Own database + Prisma schema, own migrations
- [ ] Contracts and events in `packages/contracts`
- [ ] Gateway route + auth/role guard
- [ ] Added to `docker-compose.yml` and CI
