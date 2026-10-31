# ADR-0001: Microservices architecture and technology stack

- Status: **Accepted** (2026-10-31, merged in #68)
- Date: 2026-10-31
- Issue: #8
- Deciders: Samir Guenchi, Abdennour

## Context

TrackEcom will handle orders, confirmation calls, shipments with several carriers, tracking sync, notifications, COD money and later risk scoring for many sellers at once. The team wants code that is clean, modular, scalable and secure, organised as **microservices** so that each capability can be built, deployed and scaled on its own.

Constraints:

- Two developers, so operational cost must stay low.
- Workloads are uneven: carrier tracking sync and notifications are bursty background jobs, the seller app is request/response, analytics is read-heavy.
- Carrier APIs are slow and unreliable; they must never slow down the seller's screen.
- Personal data (customer phones, addresses) must stay isolated per store and could need to be hosted in Algeria later.
- Arabic (RTL), French and English from day one.

## Decision

### 1. Architecture: coarse-grained microservices in one monorepo

Start with **five services**, each owning one business capability and its data, plus the web app:

| Service | Responsibility | Scales with |
|---|---|---|
| `gateway` | Single public HTTPS entry (BFF): token check, rate limits, CORS, routing, response shaping | requests |
| `identity` | Users, sessions, stores (tenants), memberships, roles | logins |
| `orders` | Orders, items, products, imports, confirmation workflow | orders per day |
| `shipping` | Carrier accounts, shipments, labels, tracking sync, prices, wilayas/communes | parcels in transit |
| `notifications` | In-app, SMS, WhatsApp, email | status changes |

Later services follow the same template when their phase starts: `payments` (COD reconciliation, wallet), `risk` (risk score, shared blacklist), `analytics`, `integrations` (Shopify, WooCommerce, YouCan, Sheets). Each new service needs its own short ADR.

Rules (detailed in `.claude/skills/service-architecture`):

- **Database per service.** One PostgreSQL server in early phases, but a separate database and DB user per service; no cross-service joins. Each service has its own Prisma schema and migrations.
- **Communication.** Clients talk only to `gateway`. Synchronous service-to-service calls use internal HTTP/JSON with typed clients generated from shared zod contracts, with timeouts, retries on idempotent calls and circuit breakers. State changes are announced as **versioned domain events** (`orders.order.confirmed.v1`).
- **Reliable events.** Transactional **outbox** in each service, **idempotent consumers**, dead-letter handling.
- **Stateless processes.** Any service can run N replicas; sessions, caches and locks live in Redis.
- **Clean architecture inside each service.** `domain` / `application` (use cases + ports) / `infrastructure` (adapters) / `interface` (controllers, consumers). This keeps services small and makes it cheap to split or merge them later.

### 2. Technology choices

| Topic | Decision | Notes |
|---|---|---|
| Runtime | **Node.js 24 LTS** (`.nvmrc`) | Active LTS until late 2026, maintenance to 2028 |
| Language | **TypeScript, `strict: true`** everywhere | No `any`, shared tsconfig in `packages/config` |
| Package manager | **pnpm** workspaces | Fast, strict dependency isolation |
| Monorepo tool | **Turborepo** | Cached `build`, `lint`, `typecheck`, `test` per package |
| Services | **NestJS** on the Fastify adapter | DI fits ports/adapters; one framework for all services |
| Web | **Next.js** (App Router) + Tailwind + `next-intl` | RTL and three locales; owned by Abdennour |
| Mobile (Phase 3) | React Native (Expo) | Reuses `packages/contracts` |
| Contracts | **zod** in `packages/contracts`, OpenAPI generated from zod | Single source of truth for types, validation and docs |
| Database | **PostgreSQL 17** | One database per service |
| ORM | **Prisma** (over Drizzle) | Mature migrations and typed client; one schema per service keeps files small. Drizzle stays an option for a read-heavy `analytics` service |
| Cache / jobs | **Redis 7** (or Valkey) + **BullMQ** | Carrier sync, imports, notifications run as jobs in the owning service |
| Event bus | **Redis Streams** behind the `EventBus` interface in `packages/events` | Reuses Redis; consumer groups give at-least-once delivery. Swap to NATS JetStream or Kafka by writing a new adapter if volume demands |
| Auth | **Own implementation in `identity`** (not Auth.js/Lucia) | argon2id passwords; 15 min ES256 access JWT + rotating refresh tokens; services verify with JWKS locally; httpOnly cookies for web |
| Service-to-service auth | Signed short-lived service tokens on a private network; mTLS when moving to Kubernetes | Services are never exposed publicly |
| Testing | Vitest, Supertest, Testcontainers, Playwright | See `.claude/skills/testing` |
| Observability | pino JSON logs, OpenTelemetry traces/metrics, Sentry for errors | `x-correlation-id` propagated through HTTP and events |
| Code quality | ESLint (size + complexity limits), Prettier, commitlint, husky + lint-staged | Limits from `AGENTS.md` enforced in CI |

### 3. Hosting

- **Local:** Docker Compose (Postgres, Redis, Mailpit) plus `pnpm dev` (#11).
- **Staging and production, Phases 0-2:** one Docker image per service, run on a container host behind a reverse proxy (Caddy or Traefik) with managed or self-hosted PostgreSQL and daily encrypted backups (#21). Start on an EU provider close to Algeria for latency and cost.
- **Scale-out, Phase 3+:** move the same images to Kubernetes (k3s or managed) with horizontal autoscaling per service when traffic justifies it.
- **Data in Algeria:** because everything is containers + PostgreSQL + Redis with no proprietary cloud services, the stack can move to an Algerian data centre when customers or law 18-07 require it. No vendor-locked services (no proprietary queues or databases) are allowed without a new ADR.

## Alternatives considered

1. **Modular monolith first.** Lowest operating cost for two people. Not chosen because the team wants independent deployment and scaling of the bursty parts (tracking sync, notifications) and clear ownership from the start. Mitigation: services are coarse-grained and use clean architecture internally, so two services can be merged if the overhead proves too high.
2. **Fine-grained microservices with Kafka and Kubernetes from day one.** Too much infrastructure for the team size and Phase 0 timeline. The `EventBus` interface and container images keep that path open.
3. **Separate repositories per service.** Rejected: shared contracts, atomic cross-service changes and one CI are much easier in a monorepo.

## Consequences

Positive:

- Each capability is small, owned, tested and deployed alone; a carrier outage cannot take down order entry.
- Bursty workloads scale independently.
- Strong tenant and data isolation per service limits the impact of a bug.
- Clear seams for the two developers to work in parallel.

Negative, and how we handle them:

- **More moving parts.** One service template, one Docker Compose, one CI pipeline with Turborepo filters.
- **No cross-service transactions.** Outbox + events + idempotent consumers; sagas for multi-step flows (e.g. order -> shipment -> COD).
- **Eventual consistency in read models.** UI shows statuses from the owning service; denormalised copies are refreshed by events.
- **Distributed debugging.** Correlation IDs and OpenTelemetry from the first service.

## Follow-up

- #9 creates the monorepo with `apps/`, `services/`, `packages/` and the shared configs.
- `docs/PARALLEL_PLAN.md` folder ownership updated to the `services/` layout in this PR.
- README "Tech direction" moves from proposed to decided once this ADR is accepted.
