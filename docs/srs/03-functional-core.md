# 3.1 Functional requirements, part A: accounts, orders, confirmation and risk

[Back to contents](README.md) · Legend: ✅ Built · 🟡 Partial · ⬜ Planned · Verification T/D/I/A (see README)

## 3.1.1 Identity and access (`IAM`, service `identity`)

| Id | Requirement | Pri | Status | Source | Ver |
|---|---|---|---|---|---|
| IAM-001 | The system shall let a person register with name, email and password; the password shall be 10 to 128 characters and stored only as an argon2id hash (19 MiB, 2 iterations). | P0 | ✅ | #15 | T |
| IAM-002 | The system shall send an email verification link and accept `POST /auth/verify-email` with its single-use token. | P0 | ✅ | #15 | T |
| IAM-003 | `POST /auth/login` shall return a 15-minute ES256 access token and a rotating 30-day refresh token (httpOnly cookie for the web). | P0 | ✅ | #15, ADR-0001 | T |
| IAM-004 | After 5 wrong passwords in a row an account shall refuse logins for 15 minutes; the response time for unknown emails shall equal that of known ones. | P0 | ✅ | #15 | T |
| IAM-005 | Login and password routes shall be rate limited per IP in addition to the account lockout. | P0 | ✅ | #15 | T |
| IAM-006 | `POST /auth/refresh` shall rotate the refresh token; reusing an already-rotated token shall revoke its whole token family. | P0 | ✅ | #15 | T |
| IAM-007 | `POST /auth/logout` shall revoke the session's refresh token family. | P0 | ✅ | #15 | T |
| IAM-008 | The system shall support forgot-password and reset-password with single-use, expiring tokens, without revealing whether an email exists. | P0 | ✅ | #15 | T |
| IAM-009 | `GET /auth/me` shall return the current user. | P0 | ✅ | #15 | T |
| IAM-010 | Identity shall publish its public keys at `GET /.well-known/jwks.json` so every service verifies access tokens locally. | P0 | ✅ | ADR-0001 | T |
| IAM-011 | The system should offer phone OTP login for sellers without email. | P2 | ⬜ | #15 | D |
| IAM-012 | Identity shall issue API keys per store with one role and exchange them for 15-minute tokens (`POST /v1/auth/token`). | P1 | ⬜ | #57, ADR-0005 | T |

## 3.1.2 Stores, team and permissions (`STO`, service `identity` + `packages/service-kit`)

| Id | Requirement | Pri | Status | Source | Ver |
|---|---|---|---|---|---|
| STO-001 | A user shall create a store (`POST /stores`) and become its owner; a user may belong to several stores (`GET /stores`). | P0 | ✅ | #17 | T |
| STO-002 | Clients shall choose the active store with the `x-store-id` header; the store id shall never be read from a body, query or path for authorisation. | P0 | ✅ | #17 | T |
| STO-003 | The system shall support the roles owner, manager, confirmation agent, warehouse/packer and accountant with the permission matrix in `docs/permissions.md` (`ROLE_PERMISSIONS`). | P0 | ✅ | #17 | T |
| STO-004 | Every route shall be denied by default unless marked `@Public()`, `@Authenticated()` or `@RequirePermission(...)`. | P0 | ✅ | #17 | T |
| STO-005 | "Not a member" and "not allowed" shall return the same `403 auth.forbidden`. | P0 | ✅ | #17 | T |
| STO-006 | Owners and managers shall invite members by email; invitations expire after 7 days and can be revoked; `POST /invitations/accept` joins the store. | P0 | ✅ | #17 | T |
| STO-007 | A manager shall manage only roles below their own; only the owner creates managers. | P0 | ✅ | #17 | T |
| STO-008 | The owner shall transfer ownership; the previous owner becomes a manager. | P1 | ✅ | #17 | T |
| STO-009 | Every service other than identity shall resolve the caller's role through identity and cache it for at most `ROLE_CACHE_SECONDS` (default 60 s). | P0 | ✅ | #17 | T |
| STO-010 | Store A's members shall never read or change store B's data; each module shall have an isolation test. | P0 | ✅ | #17 | T |
| STO-011 | Other services should read memberships from an event-fed read model instead of calling identity. | P2 | ⬜ | `docs/permissions.md` | I |
| STO-012 | The team settings screen (members, roles, invitations) shall exist in the web app. | P0 | ⬜ | #18 | D |

## 3.1.3 Audit trail (`AUD`, `packages/audit`)

| Id | Requirement | Pri | Status | Source | Ver |
|---|---|---|---|---|---|
| AUD-001 | Each service that owns business records shall write an audit event in the same transaction as the change (actor, entity, action, before/after of changed fields, IP). | P0 | ✅ identity, orders | #20 | T |
| AUD-002 | Secret-looking fields shall be stored as `[redacted]` and phones masked as `+213****1234`. | P0 | ✅ | #20 | T |
| AUD-003 | `GET /audit?entity=&id=` shall return a record's timeline newest first, needing `audit.read`, without IP or store id. | P0 | ✅ | #20 | T |
| AUD-004 | Audit events shall be kept 24 months and their IP addresses 90 days, applied daily. | P1 | ✅ | #20 | T |
| AUD-005 | Payments (COD adjustments) and integrations (API keys) shall write audit events. | P1 | ⬜ | #42, #57 | T |

## 3.1.4 Orders (`ORD`, service `orders`)

| Id | Requirement | Pri | Status | Source | Ver |
|---|---|---|---|---|---|
| ORD-001 | Users with `orders.write` shall create an order (`POST /orders`) with customer name, one or two phones (E.164), wilaya, commune, address, delivery type (home or stop desk), items, shipping fee, discount, notes and tags. | P0 | ✅ | #22 | T |
| ORD-002 | The server shall compute `codAmount = subtotal + shippingFee - discount` in whole dinars and give each order a store-unique `ref`. | P0 | ✅ | #22 | T |
| ORD-003 | An order shall record its `source` (manual, CSV, Google Sheets, Shopify, WooCommerce, YouCan, API...) and optional `externalRef`; `(store, source, externalRef)` shall be unique so a replayed import creates nothing. | P0 | ✅ | #22, ADR-0003 | T |
| ORD-004 | Orders shall follow the state machine in `docs/order-status.md` (`ORDER_TRANSITIONS`); any other move shall fail with `orders.illegal_transition`. | P0 | ✅ | #22 | T |
| ORD-005 | Orders shall be editable only in `new`, `to_confirm`, `unreachable`, `postponed` and `confirmed`; after `shipped` they can no longer be cancelled, only returned. | P0 | ✅ | #22 | T |
| ORD-006 | Every write shall use optimistic locking (`version`); a stale write shall fail with a conflict. | P0 | ✅ | #22 | T |
| ORD-007 | `GET /orders` shall list with cursor pagination and filters on status (several), wilaya, source, agent, carrier, tag, flagged, creation date range and a text search on ref, name and tracking number (trigram index). | P0 | ✅ | #22 | T |
| ORD-008 | `GET /orders/:id` shall return the order and items; `GET /orders/:id/history` its status history. | P0 | ✅ | #22 | T |
| ORD-009 | `POST /orders/bulk` shall change status or assign an agent for many orders, returning which succeeded and which failed and why. | P1 | ✅ | #22 | T |
| ORD-010 | `DELETE /orders/:id` shall soft-delete: the order leaves the API but stays for the audit trail; `orders.order.deleted.v1` is emitted. | P1 | ✅ | #22 | T |
| ORD-011 | The system shall mark a possible duplicate when the same phone ordered the same items within 48 hours. | P1 | ✅ | #22 | T |
| ORD-012 | Creating an order and changing its status shall emit `orders.order.created.v1` and `orders.order.status-changed.v1` through the outbox. | P0 | ✅ | #22 | T |
| ORD-013 | Orders shall import shop orders from `integrations.order.received.v1` idempotently. | P0 | ✅ | #47, ADR-0003 | T |
| ORD-014 | Orders shall expose `GET /internal/stores/:storeId/orders/:orderId/contact` and `/origin` only to services holding `INTERNAL_TOKEN`. | P0 | ✅ | ADR-0004 | T |
| ORD-015 | Sellers shall import orders from a CSV or Excel file with column mapping and a preview of errors. | P0 | ⬜ | #25 | T |
| ORD-016 | Order items should reference catalogue products (`productId`) once #27 exists. | P1 | ⬜ | #27 | T |
| ORD-017 | The web app shall provide order list, detail and form screens. | P0 | ⬜ | #23, #24 | D |

## 3.1.5 Confirmation centre (`CNF`, service `orders`)

| Id | Requirement | Pri | Status | Source | Ver |
|---|---|---|---|---|---|
| CNF-001 | `GET /confirmation/next` shall give the calling agent the next due order and lock it to them for a limited time, so two agents never call the same customer; `POST /confirmation/orders/:id/release` frees it. | P0 | ✅ | #28 | T |
| CNF-002 | Orders shall be assigned round-robin or by agent rules on wilaya and product. | P1 | ✅ | #28 | T |
| CNF-003 | `POST /confirmation/calls` shall record an outcome (`confirmed`, `no_answer`, `busy`, `wrong_number`, `cancelled` with reason, `postponed` with date, `call_back`), duration and note, and move the order accordingly. | P0 | ✅ | #28 | T |
| CNF-004 | An order shall not be offered again the same day after `maxAttemptsPerDay` (default 3) and shall move to `unreachable` after `unreachableAfter` unreached calls (default 6). | P0 | ✅ | #28 | T |
| CNF-005 | Each call shall emit `orders.call.logged.v1`. | P1 | ✅ | #28 | T |
| CNF-006 | Stores shall keep a call script per language (Arabic, French, Darija) with placeholders `{customerName}`, `{orderRef}`, `{items}`, `{total}`, `{wilaya}`. | P1 | ✅ | #28 | T |
| CNF-007 | `GET /confirmation/stats` shall give per-agent calls, calls per hour, confirmed, confirm rate and average handle time for a period. | P1 | ✅ | #28 | T |
| CNF-008 | The system shall learn the hours a customer group answers best and schedule retries then (`GET /confirmation/best-time`). | P2 | ✅ | #54 | T |
| CNF-009 | A seller shall send a customer a single-use, expiring link (`POST /orders/:id/confirmation-link`); `GET/POST /public/confirm/:token` lets the customer confirm or cancel without an account. | P1 | ✅ | #54 | T |
| CNF-010 | The agent workspace screen (queue, script, one-key outcomes) shall exist in the web app. | P0 | ⬜ | #29 | D |
| CNF-011 | Automatic reminders by SMS/WhatsApp to unreachable customers should be sent through notifications. | P2 | ⬜ | #54, ADR-0004 | T |

## 3.1.6 Fake orders and blacklist (`FRD`, service `orders`)

| Id | Requirement | Pri | Status | Source | Ver |
|---|---|---|---|---|---|
| FRD-001 | On creation the system shall set risk flags: `blacklisted`, `suspicious_phone`, `order_burst` (a third order from one phone within minutes), `gibberish_name`, `impossible_address` (commune not in wilaya, checked against shipping's geography). | P1 | ✅ | #52 | T |
| FRD-002 | Stores shall add, list and remove blacklist entries (phone, or name in a commune) via `/blacklist`. | P1 | ✅ | #52 | T |
| FRD-003 | A shared refusal signal across stores (`network_refusals`) shall exist behind `NETWORK_SIGNAL_ENABLED`, off until the privacy decision (TBD-05). | P2 | 🟡 | #52 | T |
| FRD-004 | Flags shall be visible in the order list filter (`flagged`) and never block an order on their own. | P1 | ✅ | #52 | T |

## 3.1.7 Return-risk score (`RSK`, service `orders`)

| Id | Requirement | Pri | Status | Source | Ver |
|---|---|---|---|---|---|
| RSK-001 | `GET /orders/:id/risk-score` shall return a 0 to 100 score, a level (low < 30, medium 30 to 59, high ≥ 60) and the three heaviest reasons with AR/FR/EN sentences. | P1 | ✅ | #50 | T |
| RSK-002 | Score rules (`rules-v1`) shall weigh the phone's past returns and deliveries at the store, the store's return rate to the wilaya, COD amount, night ordering, unreached calls, fake-order flags and duplicates (`docs/research/risk-score.md`). | P1 | ✅ | #50 | T |
| RSK-003 | The score shall be computed on read so it uses the latest history. | P1 | ✅ | #50 | T |
| RSK-004 | The rules shall be evaluated on real outcomes: the riskiest 20% of orders should contain ≥ 50% of returns. | P1 | ⬜ | #50 | A |
| RSK-005 | The web app shall show the score and reasons to agents before they confirm. | P1 | ⬜ | #51 | D |
| RSK-006 | A learned model may replace the rules when enough labelled data exists, in a separate `risk` service. | P2 | ⬜ | ADR-0001 | A |
