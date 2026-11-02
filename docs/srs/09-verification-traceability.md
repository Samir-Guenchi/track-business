# 4. Verification, traceability and open issues

[Back to contents](README.md)

## 4.1 Verification methods

| Method | What it proves | Where |
|---|---|---|
| Unit tests (Vitest + SWC) | Domain rules: state machine, risk rules, call plan, best time, ledger, payout matching, quiet hours, poll schedule, status mapping, timeline, ETA | `*.spec.ts` next to the code |
| Integration tests | Use cases through HTTP against a real PostgreSQL and Redis: auth, tenant isolation, idempotency, outbox, consumers | `*.int.spec.ts` per service |
| Contract tests | Every request, response and event matches its zod schema; every carrier adapter passes the shared suite | `packages/contracts`, `packages/carriers/src/contract` |
| Static checks | Lint limits, strict types, dependency audit | CI `verify` job on every PR |
| Inspection | Architecture rules, configuration, documents | PR review, ADRs, this SRS |
| Demonstration | Screens and end-to-end flows (Playwright later) on staging | Beta plan (#38) |
| Analysis | Performance, risk-score quality, availability | Load tests and metrics (⬜ #21), `domain/evaluation.ts` |

A requirement is accepted when its verification passes in CI or on staging, and the PR that built it links the requirement id.

## 4.2 Acceptance scenarios (end to end)

| Id | Scenario | Requirements | Status |
|---|---|---|---|
| ACC-01 | A seller registers, verifies email, creates a store and invites an agent who accepts. | IAM-001..003, STO-001, STO-006 | ✅ API · ⬜ UI |
| ACC-02 | A Shopify order arrives within a minute with a matched address; one with an unknown city waits in needs-fix and is resolved. | INT-003..005, ORD-013 | ✅ API |
| ACC-03 | An agent takes the next order, logs `no_answer` twice and `confirmed` the next day at the suggested hour. | CNF-001..004, CNF-008 | ✅ API · ⬜ UI |
| ACC-04 | The seller ships 50 confirmed orders with the suggested carrier; the carrier times out once and no parcel is duplicated. | PRC-004, SHP-001..003, NFR-REL-004 | ✅ API (fake carrier) |
| ACC-05 | Carrier webhooks move a parcel to out-for-delivery then delivered; the order follows, the customer gets messages after quiet hours, the shop gets the tracking link. | TRK-001..003, NTF-001..005, INT-006 | ✅ API (fake provider) |
| ACC-06 | A payout statement is imported; one line has the wrong amount and one parcel is never paid; both are flagged and the ledger balances. | PAY-001..006 | ✅ API |
| ACC-07 | The customer opens the tracking link and sees status, ETA and timeline with no personal data. | TRK-005, TRK-006 | ✅ API · ⬜ page |
| ACC-08 | A member of store A cannot read or change anything in store B through any endpoint. | STO-010, NFR-SEC-002 | ✅ |

## 4.3 Traceability matrix (issue → requirements → code)

| Issue | Title (short) | Requirements | Code / document | Status |
|---|---|---|---|---|
| #8 | ADR stack | CON-01..08 | `docs/adr/0001-*` | ✅ |
| #9, #10 | Monorepo, CI | NFR-MNT-001, NFR-MNT-004 | root configs, `.github/workflows/ci.yml` | ✅ |
| #11 | Local Docker Compose (Postgres, Redis, Mailpit) | 2.4 | `docker/service.Dockerfile` only; local compose file not merged yet | ⬜ |
| #12 | API skeleton, gateway | GW-001..006 | `services/gateway`, `packages/service-kit` | 🟡 |
| #13, #14, #16, #18 | Web skeleton, design system, auth and team screens | WEB-001..003, UI-001..007, STO-012 | `apps/web`, `packages/ui` | 🟡 / ⬜ |
| #15 | Auth API | IAM-001..010 | `services/identity/src/modules/auth` | ✅ |
| #17 | Stores and roles | STO-001..010 | `services/identity/src/modules/stores`, `service-kit/store-access` | ✅ |
| #19 | Wilayas and communes | GEO-001..004 | `services/shipping/src/modules/geo` | ✅ |
| #20 | Audit log | AUD-001..004 | `packages/audit`, `modules/audit` | ✅ |
| #21 | Staging, Sentry, backups | NFR-REL-008, NFR-OBS-002, NFR-OBS-005 | `deploy/`, `deploy.yml`, `restore-drill.yml`, `docs/runbook.md` | 🟡 secrets pending |
| #22 | Orders API | ORD-001..012, ORD-014 | `services/orders/src/modules/orders` | ✅ |
| #23, #24 | Orders screens | ORD-017 | `apps/web` | ⬜ |
| #25 | CSV/Excel import | ORD-015 | (none yet) | ⬜ |
| #26 | Google Sheets | INT-007 | `packages/connectors/src/google-sheets` | ✅ |
| #27 | Products | ORD-016, STK-001 | (none yet) | ⬜ |
| #28 | Confirmation API | CNF-001..007 | `services/orders/src/modules/confirmation` | ✅ |
| #29 | Agent workspace | CNF-010, UI-003 | `apps/web` | ⬜ |
| #30 | Carrier adapter | CAR-001..007, CAR-009 | `packages/carriers`, `modules/carriers` | 🟡 sandbox |
| #31 | Shipments and labels | SHP-001..006 | `modules/shipments`, `orders/modules/shipment-status` | 🟡 labels ⬜ |
| #32 | Tracking sync | TRK-001..004 | `services/shipping/src/modules/tracking` | ✅ |
| #33 | Prices | PRC-001..003 | `services/shipping/src/modules/pricing` | ✅ |
| #34, #35 | Tracking page, timeline | TRK-005, TRK-008, WEB-006 | API ✅, pages ⬜ | 🟡 |
| #36, #37 | Dashboard, in-app notifications | WEB-004, NTF-011 | — | ⬜ |
| #38, #39 | Private beta, landing | BET-001 | `docs/beta-plan.md` | 🟡 plan only |
| #40 | Carrier SDK + 3 carriers | CAR-006, CAR-008 | contract suite ✅, adapters ⬜ | 🟡 |
| #41 | Smart carrier suggestion | PRC-004, PRC-005 | `modules/suggestion` | ✅ |
| #42 | COD reconciliation | PAY-001..007, PAY-009 | `services/payments`, ADR-0002 | ✅ / 🟡 file parsing |
| #43, #44 | COD screens, wallet | PAY-008 | — | ⬜ |
| #45 | Returns | RET-001 | — | ⬜ |
| #46 | SMS/WhatsApp | NTF-001..010 | `services/notifications`, ADR-0004 | 🟡 provider |
| #47 | Shopify | INT-001..008 | `services/integrations`, `packages/connectors/src/shopify`, ADR-0003 | ✅ / OAuth ⬜ |
| #48 | WooCommerce, YouCan | INT-009 | — | ⬜ |
| #49 | Launch checklist | LCH-001, NFR-PRV-005 | `docs/launch-checklist.md` | 🟡 doc |
| #50, #51 | Risk score, risk UI | RSK-001..006 | `modules/risk-score`, `docs/research/risk-score.md` | ✅ v1 / ⬜ UI |
| #52 | Blacklist and fake orders | FRD-001..004 | `services/orders/src/modules/fraud` | ✅ / signal off |
| #53 | Analytics | ANL-001, ANL-002 | — | ⬜ |
| #54 | Best time, reminders, self-confirm | CNF-008, CNF-009, CNF-011 | `modules/confirmation`, `modules/self-confirm` | ✅ / reminders ⬜ |
| #55 | ETA | TRK-006, TRK-007 | `services/shipping/src/modules/eta` | ✅ |
| #56 | Mobile app | MOB-001, MOB-002 | — | ⬜ |
| #57 | Public API | IAM-012, API-001..006 | ADR-0005 | ⬜ |
| #58 | Warehouses | STK-002 | — | ⬜ |
| #59 | Carrier portal | POR-001 | `docs/research/carrier-portal.md` | ⬜ |
| #60 | Social leads | INT-010 | — | ⬜ |
| #61 | E-payment | PAY-010 | `docs/research/e-payment.md` | ⬜ |
| #62 | Billing | BIL-001 | — | ⬜ |
| #63 | Maghreb study | MAG-001 | `docs/research/maghreb.md` | ✅ |

## 4.4 Open issues (TBD)

| Id | Question or missing input | Blocks | Owner |
|---|---|---|---|
| TBD-01 | Accept ADR-0002 (payments), ADR-0003 (integrations), ADR-0004 (notifications), ADR-0005 (public API) | PAY, INT, NTF, API | Samir |
| TBD-02 | Gateway routing and token check design (GW-003..005) before the web app calls the API | WEB-005, GW | Samir |
| TBD-03 | Choose the SMS gateway and set up WhatsApp Business (templates, approval) | NTF-010, CNF-011 | Samir |
| TBD-04 | Carrier sandbox or test merchant accounts (Yalidine first, then Ecotrack) and which carriers beta sellers use | CAR-007, CAR-008 | Samir |
| TBD-05 | Legal basis for the shared refusal signal across stores | FRD-003 | Samir + lawyer |
| TBD-06 | Verify wilayas 59 to 69 and their communes against the Journal Officiel | GEO-005 | Samir |
| TBD-07 | Lawyer review for Law 18-07 / 25-11: ANPDP declaration, retention periods, privacy policy, seller terms | NFR-PRV-003, NFR-PRV-005, 3.6.3 | Samir |
| TBD-08 | Yearly lunar holiday dates for the ETA | TRK-007 | Samir |
| TBD-09 | Shopify partner app (client id, secret, scopes) for OAuth | INT-008 | Samir |
| TBD-10 | Production and staging secrets: `*_DATABASE_URL` for payments, notifications, integrations (and backups), `SHOP_KEK`, `INTERNAL_TOKEN`, `MESSAGE_WEBHOOK_TOKEN`, `TRACKING_URL`, `SELF_CONFIRM_URL`, `GOOGLE_SERVICE_ACCOUNT_JSON`, deploy host | NFR-OBS-005, NFR-REL-008 | Samir |
| TBD-11 | API plan limits (requests per minute, webhook endpoints per store) and SDK scope | API-001..006, BIL-001 | Samir |
| TBD-12 | Recruit 10 to 20 beta sellers | BET-001 | Samir |
| TBD-13 | Performance targets NFR-PERF-001..007 confirmed by a load test on staging | NFR-PERF | Samir |
