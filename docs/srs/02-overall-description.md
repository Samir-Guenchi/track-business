# 2. Overall description

[Back to contents](README.md)

## 2.1 Product perspective

TrackEcom is a new, self-contained SaaS product. It sits between the seller's sales channels, the seller's team, the carriers and the customer:

- **Upstream** it takes orders from shops (Shopify, Google Sheets now; WooCommerce, YouCan, CSV, Facebook/Instagram leads, public API later) and from manual entry.
- **Downstream** it talks to carriers' APIs to create parcels and follow them, to SMS and WhatsApp providers to message customers, and back to the shop to push the tracking number.
- **Money** flows outside TrackEcom (the carrier pays the seller); TrackEcom only imports the statements and checks them.

The system is a set of small services in one monorepo (ADR-0001). The context, container, event and deployment views are drawn in [docs/architecture/diagrams.md](../architecture/diagrams.md).

| Element | Role | State in `dev` |
|---|---|---|
| `services/gateway` (port 4000) | Only public entry point; auth check, rate limits, routing (BFF) | 🟡 Runs and serves health; proxy routes not added yet |
| `services/identity` (4001) | Users, sessions, JWKS, stores, memberships, invitations, audit | ✅ |
| `services/shipping` (4002) | Geography, prices, carrier accounts, parcels, tracking, ETA, suggestion | ✅ |
| `services/orders` (4003) | Orders, confirmation, fraud flags, blacklist, risk score, self-confirm, shop import | ✅ |
| `services/payments` (4004) | COD parcels, payouts, matching, ledger, missing money | ✅ |
| `services/notifications` (4005) | Customer message settings, templates, queue, sender, opt-outs | ✅ (fake provider only) |
| `services/integrations` (4006) | Shop connections, sync, address matching, needs-fix queue, tracking push-back | ✅ |
| `apps/web` | Next.js seller app, public tracking and self-confirm pages | 🟡 Skeleton (layout and home page) |
| `apps/mobile` | React Native app for sellers and agents | ⬜ Phase 3 |
| `packages/*` | `contracts`, `events`, `service-kit`, `carriers`, `connectors`, `audit`, `ui`, `config` | ✅ (`ui` is a stub) |
| Later services | `webhooks` (ADR-0005), `risk`, `analytics` (ADR-0001) | ⬜ |

## 2.2 Product functions (summary)

1. **Account and team**: register, verify email, log in, reset password, create stores, invite members, assign roles, transfer ownership, see the audit trail.
2. **Order intake**: create, edit, list, search, filter, bulk-update and soft-delete orders; import from shops; detect duplicates and fake orders.
3. **Confirmation centre**: give each agent the next order to call, record outcomes, retry at the best time, mark unreachable, send self-confirmation links, measure agents.
4. **Risk**: flag fake orders, keep a store blacklist, score each order's return risk with reasons.
5. **Shipping**: keep geography and prices, store carrier credentials safely, suggest a carrier, create parcels exactly once.
6. **Tracking**: receive carrier webhooks, poll as a fallback, keep one normalised timeline, predict the delivery window, serve a public tracking page.
7. **Money**: record COD per parcel, import carrier payouts, match them, keep a ledger, flag missing or wrong amounts.
8. **Customer messages**: send SMS/WhatsApp on key events with quiet hours, templates, opt-outs and cost per store.
9. **Shop integrations**: connect shops, pull orders, fix unmatched addresses, push tracking back.
10. **Later**: analytics, products and stock, returns, wallet, mobile, public API and webhooks, carrier portal, e-payment, billing.

## 2.3 User classes and characteristics

| Class | Who | Uses | Frequency, skill |
|---|---|---|---|
| **Store owner** | Seller running the shop, often alone at first | Everything; billing and ownership | Daily; low to medium technical skill; mostly on a phone |
| **Manager** | Trusted employee | Orders, team (below manager), shipping, money | Daily |
| **Confirmation agent** | Call-centre staff, often part-time | Confirmation queue and call outcomes only | Hours per day, many calls; needs a fast keyboard flow |
| **Warehouse / packer** | Packing staff | Ready-to-ship lists, labels, hand-over | Daily, simple screens |
| **Accountant** | Internal or external | COD, payouts, statements, audit | Weekly |
| **Customer** | Buyer of the parcel | Public tracking page, self-confirm link, SMS/WhatsApp | Occasional; Arabic or French; no account |
| **Integrator** (Phase 4) | Agency or developer | Public API, webhooks, SDKs | Technical |
| **Carrier staff** (Phase 4) | Delivery company | Carrier portal | Daily |
| **Platform operator** | Samir | Deploys, runbook, backups, secrets | As needed |

## 2.4 Operating environment

- **Services**: Node.js 24 LTS, NestJS 12 on Fastify, TypeScript strict, Prisma 7, PostgreSQL 17 (one database per service), Redis 7 (streams, locks, caches), one Docker image per service.
- **Hosting (Phases 0 to 2)**: one container host per environment (EU VPS near Algeria) with Docker Compose (`deploy/compose.yml`), Caddy for TLS in front of the gateway, managed PostgreSQL with daily backups and point-in-time recovery, encrypted off-site dumps (`deploy/backup/`).
- **Hosting (Phase 3+)**: the same images on Kubernetes (k3s or managed) with autoscaling per service; can move to an Algerian data centre.
- **Clients**: current mobile browsers (Chrome on Android first), desktop Chrome, Firefox, Edge, Safari; slow 3G/4G networks; React Native app later.
- **Environments**: local (`pnpm dev` with local PostgreSQL and Redis; the Docker Compose file for them is #11, not merged yet), staging (deployed on every push to `dev`), production (every push to `main`, approved by Samir).

## 2.5 Design and implementation constraints

| Id | Constraint | Source |
|---|---|---|
| CON-01 | Microservices with **database per service**; no service reads another's tables | ADR-0001 |
| CON-02 | Shared types and validation only through zod schemas in `packages/contracts` | ADR-0001, contract-first skill |
| CON-03 | Async state changes as versioned events through a transactional outbox; consumers idempotent | ADR-0001 |
| CON-04 | Slow or flaky work (carriers, SMS, shops, imports, reports) runs in background workers, never in a user request | AGENTS.md rule 4 |
| CON-05 | `storeId` comes only from the authenticated context; every query is scoped by it | AGENTS.md rule 5 |
| CON-06 | Code limits: files ≤ 250 lines, functions ≤ 40 lines, ≤ 3 parameters, complexity ≤ 10, nesting ≤ 3; no `any`, no `@ts-ignore` | AGENTS.md |
| CON-07 | Clean architecture inside each service: `interface -> application -> domain`, `infrastructure` implements ports | ADR-0001 |
| CON-08 | No proprietary cloud services (queues, databases) without a new ADR, so the stack can move to Algeria | ADR-0001 |
| CON-09 | Arabic (RTL), French and English in every user-facing screen; Darija in scripts and messages | Roadmap |
| CON-10 | Amounts in whole DZD integers; time zone `Africa/Algiers` for business days and quiet hours | `docs/order-status.md` |
| CON-11 | Personal data processing must follow Law 18-07 / 25-11 (declaration, consent, retention, access rights) | R10, #49 |
| CON-12 | Every PR targets `dev`; only Samir merges `dev -> main` | `docs/WORKFLOW.md` |

## 2.6 User documentation

- In-app help per screen in AR/FR/EN (⬜ with the web app).
- Seller onboarding guide and carrier connection guides (⬜ #38 beta plan).
- Developer portal generated from OpenAPI (⬜ ADR-0005).
- Operator runbook (✅ `docs/runbook.md`), carrier adapter guide (✅ `docs/carriers/adding-a-carrier.md`).

## 2.7 Assumptions and dependencies

| Id | Assumption or dependency | If false |
|---|---|---|
| ASM-01 | Carriers expose an HTTP API with per-store credentials (Yalidine first, Ecotrack platform second) | Manual export/import of parcels; slower tracking |
| ASM-02 | Carrier status labels can be mapped to the nine normalised parcel statuses | Unknown labels are logged (`shipping.carrier-status.unknown.v1`) and mapped by hand |
| ASM-03 | Carriers can look a parcel up by our reference, so creation can be retried safely | Only one creation attempt for that carrier |
| ASM-04 | An SMS gateway and a WhatsApp Business account will be chosen (TBD-03) | Messages stay on the fake provider; no customer receives anything |
| ASM-05 | Shopify custom-app tokens are acceptable for the beta; OAuth needs a partner app | Sellers paste a token |
| ASM-06 | Wilaya/commune data (including wilayas 59 to 69 created in 2025) matches the Journal Officiel | Address matching and pricing errors |
| ASM-07 | Sellers accept that customer phones are processed to confirm and deliver orders | Legal review (TBD-07) |
| DEP-01 | Managed PostgreSQL 17, Redis 7, a container host, GHCR, GitHub Actions, Sentry, an uptime monitor | See runbook |
| DEP-02 | Google service account for Sheets import; per-store shop tokens | Integration disabled for that source |
