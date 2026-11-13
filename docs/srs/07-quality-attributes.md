# 3.5 Quality attributes (non-functional requirements)

[Back to contents](README.md) · Legend: ✅ Built / enforced · 🟡 Partial · ⬜ Planned

## 3.5.1 Performance

| Id | Requirement | Status | Ver |
|---|---|---|---|
| NFR-PERF-001 | 95% of authenticated API reads shall answer in under 300 ms and writes in under 500 ms at the gateway, at 50 requests/s per service replica. | ⬜ measure (#21) | A |
| NFR-PERF-002 | Order list and search shall stay under 500 ms (p95) for a store with 200,000 orders (composite and trigram indexes on `orders`). | 🟡 indexes built, not load-tested | A |
| NFR-PERF-003 | No user request shall wait on a carrier, shop or message provider; such work runs in workers (ship requests, tracking polls, shop sync, message sender, payout matching). | ✅ | I |
| NFR-PERF-004 | A carrier status change shall reach the order within 2 minutes when the carrier sends webhooks, and within the polling cadence (TRK-002) otherwise. | 🟡 | A |
| NFR-PERF-005 | A shop order shall appear in TrackEcom within 1 minute with webhooks and within `SYNC_INTERVAL_MINUTES` without. | ✅ | T |
| NFR-PERF-006 | A payout statement of 5,000 lines shall be matched within 2 minutes. | ⬜ measure | A |
| NFR-PERF-007 | Public pages (tracking, self-confirm) shall load in under 2 s on slow 3G (largest contentful paint). | ⬜ | A |

## 3.5.2 Reliability and availability

| Id | Requirement | Status | Ver |
|---|---|---|---|
| NFR-REL-001 | Production availability target: 99.5% monthly for the seller API, 99.9% for public tracking. | ⬜ | A |
| NFR-REL-002 | Events shall be delivered at least once: outbox in the same transaction, relay worker, consumer groups, dead-letter stream. | ✅ | T |
| NFR-REL-003 | Every consumer shall be idempotent (processed-event table, unique business keys). | ✅ | T |
| NFR-REL-004 | A parcel shall never be created twice for one ship request (`createShipmentOnce`). | ✅ | T |
| NFR-REL-005 | An import shall never create an order twice (`(store, source, externalRef)` unique). | ✅ | T |
| NFR-REL-006 | A carrier, shop or provider outage shall not stop order entry or confirmation; work stays queued and resumes. | ✅ | T |
| NFR-REL-007 | Concurrent edits shall not overwrite each other (optimistic `version`); queue rows are leased with `SKIP LOCKED`; confirmation orders are locked to one agent. | ✅ | T |
| NFR-REL-008 | Recovery: RPO ≤ 24 h (nightly encrypted dumps plus provider PITR), RTO ≤ 4 h; a restore drill runs on schedule (`restore-drill.yml`). | 🟡 scripts and drill workflow built; secrets pending | D |
| NFR-REL-009 | Services shall shut down gracefully (finish in-flight requests, stop workers) and expose live/ready probes. | ✅ | T |

## 3.5.3 Security

| Id | Requirement | Status | Ver |
|---|---|---|---|
| NFR-SEC-001 | Passwords argon2id; tokens ES256 with JWKS; refresh rotation with reuse detection; lockout and per-IP limits (IAM-001 to IAM-006). | ✅ | T |
| NFR-SEC-002 | Tenant isolation: `storeId` only from the authenticated context; every query scoped by it, including loads by id; isolation tests per module. | ✅ | T |
| NFR-SEC-003 | Deny-by-default authorisation on every route; same 403 for "not a member" and "not allowed". | ✅ | T |
| NFR-SEC-004 | All input validated at the boundary with strict zod schemas; body size limits; no raw SQL built from input. | ✅ | T |
| NFR-SEC-005 | Carrier and shop credentials envelope-encrypted (AES-GCM data keys wrapped by `CARRIER_KEK` / `SHOP_KEK` with key ids and rotation), decrypted only in workers, never logged or returned. | ✅ | T |
| NFR-SEC-006 | Webhooks in (carriers, shops, message providers) shall be authenticated by signature or secret token and compared in constant time. | ✅ | T |
| NFR-SEC-007 | Internal routes need `INTERNAL_TOKEN` and are never routed by the gateway. | 🟡 token built; gateway routing pending | T |
| NFR-SEC-008 | Public codes and links (tracking, self-confirm, invitations, resets) are random, single-purpose and, except tracking, expiring and single-use. | ✅ | T |
| NFR-SEC-009 | Only the gateway is exposed; CORS allowlist; security headers; `Server` header removed by Caddy. | ✅ | I |
| NFR-SEC-010 | Secrets only in GitHub environment secrets and the host `.env`; never in code, tests, fixtures, commits or PR text. | ✅ | I |
| NFR-SEC-011 | CI shall fail on high or critical dependency advisories; Dependabot keeps dependencies current. | ✅ | I |
| NFR-SEC-012 | Outgoing requests shall never go to a host taken from free user input (SSRF): shop hosts are restricted to the platform's domain pattern (e.g. `*.myshopify.com`); user-supplied webhook URLs shall be checked against private ranges on every delivery. | ✅ (shops); ⬜ (webhooks, WooCommerce) | T |
| NFR-SEC-013 | A penetration test or external review should run before public launch. | ⬜ (#49) | D |

## 3.5.4 Privacy and compliance (Law 18-07 / 25-11)

| Id | Requirement | Status | Ver |
|---|---|---|---|
| NFR-PRV-001 | Customer phones, names and addresses are stored only in orders; other services keep ids. Exceptions, kept minimal: notifications keeps the opt-out phones, orders' blacklist keeps the phones a store blocked, and shop orders cross integrations in an event. | ✅ | I |
| NFR-PRV-002 | Logs, Sentry and audit never hold full phones, passwords, tokens or bodies (masking, redaction). | ✅ | T |
| NFR-PRV-003 | Audit IPs kept 90 days, audit events 24 months (AUD-004); other retention periods to set with the lawyer. | 🟡 | I |
| NFR-PRV-004 | The shared refusal signal across stores stays off until a legal basis is confirmed (FRD-003). | ✅ (off) | I |
| NFR-PRV-005 | Before launch: ANPDP declaration, privacy policy, terms, data processing terms for sellers, customer opt-out and access/deletion process. | ⬜ (#49, TBD-07) | I |
| NFR-PRV-006 | The stack shall be movable to an Algerian data centre without code changes (containers, PostgreSQL, Redis only). | ✅ | I |

## 3.5.5 Scalability

| Id | Requirement | Status | Ver |
|---|---|---|---|
| NFR-SCL-001 | Every service shall be stateless and run N replicas; locks, caches and sessions live in Redis or PostgreSQL. | ✅ | I |
| NFR-SCL-002 | Workers can be switched off per replica (`WORKERS_ENABLED`) so API and worker replicas scale apart. | ✅ | I |
| NFR-SCL-003 | Phase 3 target: 500 stores, 50,000 orders/day, 200,000 parcels in transit, without changing the design (add replicas; move to k3s; swap the bus adapter if needed). | ⬜ | A |
| NFR-SCL-004 | The event bus shall stay behind the `EventBus` port so Redis Streams can be swapped for NATS JetStream or Kafka by writing an adapter. | ✅ | I |

## 3.5.6 Maintainability and portability

| Id | Requirement | Status | Ver |
|---|---|---|---|
| NFR-MNT-001 | Code limits from AGENTS.md enforced by ESLint in CI (file 250 lines, function 40, params 3, complexity 10, nesting 3). | ✅ | I |
| NFR-MNT-002 | Clean architecture per service: domain free of frameworks; ports in application; adapters in infrastructure. | ✅ | I |
| NFR-MNT-003 | New logic has unit tests; endpoints and events have contract tests; each service has integration tests against a real PostgreSQL. | ✅ | T |
| NFR-MNT-004 | `pnpm lint && pnpm typecheck && pnpm test` and the build pass on every PR (CI `verify` job). | ✅ | T |
| NFR-MNT-005 | Adding a carrier or shop platform is one adapter class, one registry line and the shared contract suite. | ✅ | I |
| NFR-MNT-006 | Every architecture decision is an ADR; this SRS and the diagrams change in the same PR as the behaviour. | ✅ | I |

## 3.5.7 Observability and operations

| Id | Requirement | Status | Ver |
|---|---|---|---|
| NFR-OBS-001 | JSON logs (pino) with service, release, environment and correlation id. | ✅ | T |
| NFR-OBS-002 | 5xx errors reported to Sentry with personal data removed. | ✅ | T |
| NFR-OBS-003 | OpenTelemetry traces and metrics across HTTP and events. | ⬜ | I |
| NFR-OBS-004 | Uptime monitoring every minute with email and Telegram alerts. | ⬜ setup | D |
| NFR-OBS-005 | Staging deploys on every push to `dev` within 10 minutes; production on `main` after Samir's approval; rollback by redeploying an earlier image tag. | ✅ workflow; host secrets pending | D |
| NFR-OBS-006 | Dead-letter and unknown-carrier-status counts should alert the operator. | ⬜ | D |

## 3.5.8 Usability and localisation

| Id | Requirement | Status | Ver |
|---|---|---|---|
| NFR-USE-001 | A new seller shall create a store, connect a carrier and ship a first order in under 15 minutes without help. | ⬜ (#38) | D |
| NFR-USE-002 | A trained agent shall log a call outcome in under 5 seconds after hanging up. | ⬜ (#29) | D |
| NFR-USE-003 | Backend texts shown to users (risk reasons, scripts, templates) exist in Arabic, French and English or Darija. | ✅ | T |
