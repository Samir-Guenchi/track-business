# 3.3 Functional requirements, part C: gateway, apps, public API and later phases

[Back to contents](README.md) · Legend: ✅ Built · 🟡 Partial · ⬜ Planned · Verification T/D/I/A (see README)

## 3.3.1 Gateway (`GW`, service `gateway`)

| Id | Requirement | Pri | Status | Source | Ver |
|---|---|---|---|---|---|
| GW-001 | The gateway shall be the only service reachable from the internet (Caddy terminates TLS and proxies only to it). | P0 | ✅ | ADR-0001 | I |
| GW-002 | The gateway shall expose `/health/live` and `/health/ready`, and readiness shall include its downstream dependencies. | P0 | 🟡 live/ready exist; downstream checks not yet | #12 | T |
| GW-003 | The gateway shall route the public paths of identity, orders, shipping, payments, notifications and integrations to the owning service, forwarding the access token, `x-store-id` and `x-correlation-id`. | P0 | ⬜ | #12 | T |
| GW-004 | The gateway shall never route `/internal/*` paths. | P0 | ⬜ | ADR-0004 | T |
| GW-005 | The gateway shall verify access tokens with identity's JWKS before routing authenticated paths, and apply rate limits per IP, user and (later) API key in Redis. | P0 | ⬜ | ADR-0001, ADR-0005 | T |
| GW-006 | The gateway should merge the services' OpenAPI documents into one public spec. | P1 | ⬜ | ADR-0005 | I |

Until GW-003 lands, each service already applies its own token check, CORS allowlist, rate limit (`RATE_LIMIT_PER_MINUTE`, default 300) and error format through `packages/service-kit`.

## 3.3.2 Web app (`WEB`, `apps/web`, owner Abdennour)

| Id | Requirement | Pri | Status | Source | Ver |
|---|---|---|---|---|---|
| WEB-001 | The web app shall run on Next.js (App Router) with Tailwind, in Arabic (RTL), French and English, the locale in the URL. | P0 | 🟡 skeleton | #13 | D |
| WEB-002 | It shall use the design system in `packages/ui` with the brand tokens (Kraft #C98F55, Tape Green #16523F, Stamp Red #C8382B, Ink #1C1A17, Paper #F6EEE1) and mirrored layouts in RTL. | P0 | ⬜ | #14 | D |
| WEB-003 | Screens: login, register, verify email, password reset, store onboarding (#16); team settings (#18); orders list, detail and form (#23, #24); CSV import (#25); products (#27); agent workspace (#29); shipments and labels (#31); tracking timeline and public page (#34, #35); dashboard (#36); notifications (#37); returns (#45); COD and wallet (#43, #44); risk display (#51); analytics (#53); landing page (#39). | P0-P2 | ⬜ | issues listed | D |
| WEB-004 | The dashboard shall show today's orders, to confirm, in transit, delivered, returned and money pending. | P0 | ⬜ | #36 | D |
| WEB-005 | The web app shall call only the gateway, with types from `packages/contracts`, and keep tokens in httpOnly cookies. | P0 | ⬜ | ADR-0001 | I |
| WEB-006 | The public tracking page (`TRACKING_URL`, e.g. `/t/<code>`) and self-confirm page (`SELF_CONFIRM_URL`, e.g. `/confirm/<token>`) shall work without login on a low-end phone. | P0 | ⬜ | #34, #54 | D |

## 3.3.3 Mobile app (`MOB`, `apps/mobile`)

| Id | Requirement | Pri | Status | Source | Ver |
|---|---|---|---|---|---|
| MOB-001 | A React Native (Expo) app shall let sellers follow orders and money and let agents work the confirmation queue, reusing `packages/contracts`. | P1 | ⬜ | #56 | D |
| MOB-002 | Agents should start a call from the app and log the outcome with its real duration. | P2 | ⬜ | #56 | D |

## 3.3.4 Public API and outgoing webhooks (`API`)

| Id | Requirement | Pri | Status | Source | Ver |
|---|---|---|---|---|---|
| API-001 | The gateway shall serve a versioned public API under `/v1` for orders, shipments, tracking and products. | P1 | ⬜ | #57, ADR-0005 | T |
| API-002 | API keys (`te_live_<random>`) shall be shown once, stored as SHA-256 hash plus last 4 characters, carry one non-owner role, record last use and be rotated or revoked by `store.update` members. | P1 | ⬜ | ADR-0005 | T |
| API-003 | A new `webhooks` service shall deliver subscribed events as public, versioned payloads signed `TrackEcom-Signature: t=<unix>,v1=<hex>` (HMAC-SHA256), retrying with backoff for up to 24 hours, with a delivery log. | P1 | ⬜ | ADR-0005 | T |
| API-004 | Webhook URLs shall be HTTPS and checked against private address ranges on every delivery (SSRF). | P1 | ⬜ | ADR-0005 | T |
| API-005 | Webhook payloads shall carry ids and statuses only unless the subscription allows contact details. | P1 | ⬜ | ADR-0005 | T |
| API-006 | Developer docs, a Postman collection and SDKs shall be generated from OpenAPI. | P2 | ⬜ | #57 | I |

## 3.3.5 Later capabilities

| Id | Requirement | Pri | Status | Source | Ver |
|---|---|---|---|---|---|
| STK-001 | Sellers shall keep products with variants, SKU, cost price and weight; order items may reference them. | P1 | ⬜ | #27 | T |
| STK-002 | Stock per warehouse shall move with each order (reserved on confirm, out on ship, back on return). | P2 | ⬜ | #58 | T |
| RET-001 | Returns shall be recorded with reason, received date and restock decision, and their cost shown per order. | P1 | ⬜ | #45 | T |
| ANL-001 | Analytics shall give delivery and return rates by wilaya, carrier, product and agent, and real profit after shipping and returns. | P1 | ⬜ | #53 | T |
| ANL-002 | Analytics should run in its own read-optimised service fed by events. | P2 | ⬜ | ADR-0001 | I |
| POR-001 | A carrier-side portal may let delivery companies use TrackEcom as their seller dashboard. | P2 | ⬜ | #59 | A |
| BIL-001 | Sellers shall subscribe to plans with limits (orders, members, messages, API) and be billed. | P2 | ⬜ | #62 | D |
| MAG-001 | An expansion study shall cover Morocco and Tunisia (carriers, COD habits, law). | P2 | ✅ study | #63 | I |
| BET-001 | A private beta with 10 to 20 sellers shall run before public launch, following `docs/beta-plan.md`. | P0 | ⬜ | #38 | D |
| LCH-001 | Public launch shall pass every item of `docs/launch-checklist.md` (privacy policy, terms, backups tested, monitoring, support). | P0 | ⬜ | #49 | I |
