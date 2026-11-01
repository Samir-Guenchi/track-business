# 3.4 External interface requirements

[Back to contents](README.md)

## 3.4.1 User interfaces

| Id | Requirement | Status |
|---|---|---|
| UI-001 | Every seller screen shall exist in Arabic (RTL, default), French and English; switching language shall not lose the page state. | ⬜ (#13) |
| UI-002 | Screens shall be usable on a 360 px wide phone and on desktop; tables become cards on phones. | ⬜ (#14) |
| UI-003 | The agent workspace shall be operable from the keyboard alone (one key per call outcome). | ⬜ (#29) |
| UI-004 | Colours shall meet WCAG 2.2 AA contrast; status is never shown by colour alone. | ⬜ (#14) |
| UI-005 | Dates shall use the Algiers time zone and the locale's format; amounts show "DA" / "دج" with thousands separators. | ⬜ (#13) |
| UI-006 | The public tracking and self-confirm pages shall load in under 2 s on a slow 3G phone and show only the store name, status, ETA and timeline. | ⬜ (#34, #54) |
| UI-007 | Error messages shall come from the API's error `code`, translated in the app, never raw server text. | ⬜ (#13) |

## 3.4.2 Software interfaces: HTTP API

All services speak HTTPS/JSON through the gateway (GW-003). Common rules, built in `packages/service-kit`:

- Requests and responses are validated with the zod schemas from `packages/contracts`; unknown fields are rejected (`strictObject`).
- Authentication: `Authorization: Bearer <access token>`; active store in `x-store-id`.
- Errors: `{ "error": { "code": "<service>.<reason>", "message": "...", "details"?: ... } }`, with 400 invalid, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict, 429 rate limited, 5xx unexpected.
- `x-correlation-id` is accepted or created, logged and passed to events.
- Lists use cursor pagination (`cursor`, `limit`).
- Each service serves `GET /health/live`, `GET /health/ready` and `GET /docs/openapi.json`.

Endpoint catalogue in `dev` (permission in brackets; *public* = no login):

| Service | Endpoints |
|---|---|
| identity | `POST /auth/register` *public*, `POST /auth/login` *public*, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/verify-email` *public*, `POST /auth/forgot-password` *public*, `POST /auth/reset-password` *public*, `GET /auth/me`, `GET /.well-known/jwks.json` *public*, `POST /stores`, `GET /stores`, `GET /stores/current/members` (members.read), `PATCH /stores/current/members/:id` and `DELETE` (members.manage), `POST /stores/current/transfer-ownership` (store.transfer), `POST /stores/current/invitations` and `DELETE .../:id` (members.manage), `POST /invitations/accept`, `GET /audit` (audit.read) |
| orders | `POST /orders` (orders.write), `GET /orders`, `GET /orders/:id`, `GET /orders/:id/history`, `GET /orders/:id/risk-score` (orders.read), `POST /orders/:id/status`, `POST /orders/bulk`, `DELETE /orders/:id`, `POST /orders/ship` (shipments.manage), `POST /orders/:id/confirmation-link`, `GET /confirmation/next`, `POST /confirmation/calls`, `POST /confirmation/orders/:id/release` (orders.confirm), `GET/PUT /confirmation/settings`, `GET /confirmation/scripts`, `PUT /confirmation/scripts/:language`, `GET /confirmation/stats`, `GET /confirmation/best-time`, `GET/POST/DELETE /blacklist`, `GET/POST /public/confirm/:token` *public*, `GET /internal/stores/:storeId/orders/:orderId/contact` and `/origin` (*internal token*) |
| shipping | `GET /geo/wilayas`, `GET /geo/wilayas/:code/communes`, `GET /geo/search` *public*, `GET /pricing/store-prices`, `PUT ...`, `GET /pricing/quote`, `GET/PUT /pricing/rate-cards/:carrier`, `GET /carriers`, `GET /carriers/accounts`, `PUT/DELETE /carriers/accounts/:carrier`, `GET /carriers/suggestion`, `GET/PUT /carriers/suggestion-settings`, `GET /tracking/orders/:orderId`, `GET /public/tracking/:publicCode` *public*, `POST /webhooks/:carrier/:storeId` *carrier-signed* |
| payments | `GET /money/summary`, `GET /money/parcels`, `GET/PUT /money/settings` (money.read / money.manage), `POST /payouts` (money.manage), `GET /payouts`, `GET /payouts/:id` (money.read) |
| notifications | `GET/PUT /notifications/settings`, `GET /notifications/templates`, `PUT/DELETE /notifications/templates/:trigger/:channel/:language`, `GET /notifications/messages`, `GET /notifications/usage`, `POST /notifications/opt-outs`, `DELETE /notifications/opt-outs/:phone`, `POST /webhooks/messages/:provider` *provider token* |
| integrations | `GET /integrations/connectors`, `GET/POST /integrations`, `DELETE /integrations/:id`, `GET /integrations/orders/needs-fix`, `POST .../resolve`, `POST .../skip`, `POST /webhooks/shops/:connectionId` *shop-signed* |
| gateway | `GET /health/live`, `GET /health/ready` (routing ⬜ GW-003) |

## 3.4.3 Software interfaces: domain events

Transport: Redis Streams, one stream per producing service (`events:orders`, `events:shipping`, `events:payments`, `events:integrations`), capped near 100,000 entries; one consumer group per consuming module, so N replicas share the work; failed messages go to `events:dead-letter`. Every event is wrapped in an envelope `{ id, type, occurredAt, storeId, correlationId, data }`, written to the producer's outbox in the business transaction and relayed by a worker. Consumers record processed ids (`ProcessedEvent`) and are idempotent.

| Event | Producer | Consumers | Key data |
|---|---|---|---|
| `orders.order.created.v1` | orders | (analytics, webhooks later) | order id, ref, source, status |
| `orders.order.status-changed.v1` | orders | notifications (`order_confirmed`) | order id, from, to, actor |
| `orders.order.deleted.v1` | orders | (later) | order id |
| `orders.call.logged.v1` | orders | (analytics later) | order id, agent, outcome, duration |
| `orders.order.ship-requested.v1` | orders | shipping | order id, reference `<ref>-v<version>`, carrier, origin and destination, delivery type, stop desk, COD, declared value, contents, recipient name/phones/address |
| `shipping.shipment.created.v1` | shipping | orders, payments, notifications, integrations | shipment id, order id, carrier, tracking number, public code, COD amount |
| `shipping.shipment.failed.v1` | shipping | orders | order id, failure reason |
| `shipping.shipment.status-changed.v1` | shipping | orders, payments, notifications | shipment id, order id, parcel status, failed-attempt reason, at |
| `shipping.carrier-status.unknown.v1` | shipping | (operator alert) | carrier, raw label |
| `payments.payout.imported.v1` | payments | (notifications later) | payout id, totals by match result |
| `payments.parcel.flagged.v1` | payments | (notifications later) | parcel, reason (`missing`, `amount_mismatch`) |
| `integrations.order.received.v1` | integrations | orders | platform, external ref, customer, address codes, items, totals |

Rules: a breaking change creates `v<N+1>` and both versions run in parallel until consumers move; contact details travel only in `integrations.order.received.v1` and `orders.order.ship-requested.v1` (carriers need them); every other event carries ids only (ADR-0003, ADR-0004).

## 3.4.4 Software interfaces: internal synchronous calls

| Caller | Callee | Call | Purpose | Protection |
|---|---|---|---|---|
| every service | identity | `GET /stores` with the caller's token | role in the store (cached ≤ 60 s) | user token |
| every service | identity | `GET /.well-known/jwks.json` | verify tokens locally | public keys |
| orders | shipping | `GET /geo/wilayas/:code/communes` | `impossible_address` flag | none (public reference data) |
| integrations | shipping | `GET /geo/search` | address matching | none (public reference data) |
| notifications | orders | `GET /internal/.../contact` | phone and name at send time | `INTERNAL_TOKEN` |
| integrations | orders | `GET /internal/.../origin` | was this order imported from a shop? | `INTERNAL_TOKEN` |

Every call has a timeout and is retried only when idempotent; failures leave work queued, never lost.

## 3.4.5 External system interfaces

| System | Interface | Direction | Status |
|---|---|---|---|
| Carriers (Yalidine, Ecotrack platform, ZR Express, Maystro, NOEST) | REST + webhooks through `CarrierAdapter` | both | Yalidine 🟡, others ⬜ |
| Shopify | Admin REST/GraphQL with custom-app token; webhooks (HMAC) | both | ✅ (OAuth ⬜) |
| Google Sheets | Sheets API with a service account the seller shares the sheet with | in | ✅ |
| WooCommerce, YouCan | REST + webhooks through `StoreConnector` | both | ⬜ |
| SMS gateway, WhatsApp Business (Meta Cloud API) | `MessageProvider` port + receipts webhook | out (+receipts) | ⬜ (fake provider) |
| SMTP | email verification, password reset, invitations (Mailpit locally) | out | ✅ |
| Sentry | 5xx errors with headers, bodies and user data removed | out | ✅ |
| Uptime monitor | polls `HEALTH_URL` every minute | in | ⬜ setup |
| S3-compatible bucket | encrypted (age) nightly PostgreSQL dumps | out | ✅ scripts |
| CIB / Edahabia (SATIM) | e-payment | both | ⬜ (#61) |

## 3.4.6 Hardware and communications interfaces

- No special hardware. Label printing uses the browser's print of a PDF (A4 or 10x15 thermal).
- All external traffic is HTTPS (TLS 1.2+) through Caddy; services listen only on the private Docker network.
- Outbound calls go only to configured carrier, shop and provider hosts; user-supplied URLs (shop domains, later webhook endpoints) are validated against private ranges.
