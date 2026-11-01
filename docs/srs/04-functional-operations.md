# 3.2 Functional requirements, part B: shipping, tracking, money, messages and shops

[Back to contents](README.md) · Legend: ✅ Built · 🟡 Partial · ⬜ Planned · Verification T/D/I/A (see README)

## 3.2.1 Reference geography (`GEO`, service `shipping`)

| Id | Requirement | Pri | Status | Source | Ver |
|---|---|---|---|---|---|
| GEO-001 | The system shall hold all 69 wilayas and 1,541 communes with Arabic and Latin names, seeded idempotently on every deploy. | P0 | ✅ | #19 | T |
| GEO-002 | `GET /geo/wilayas`, `GET /geo/wilayas/:code/communes` and `GET /geo/search?q=` shall serve the data, the search tolerating accents, case and Arabic/Latin spelling. | P0 | ✅ | #19 | T |
| GEO-003 | Code changes (new wilayas, renamed communes) shall be recorded (`GeoCodeChange`) so old orders still resolve. | P1 | ✅ | #19 | T |
| GEO-004 | The system shall keep stop desks per carrier and map our commune ids to each carrier's codes (`CarrierGeoMapping`). | P0 | ✅ | #19, #30 | T |
| GEO-005 | Wilayas 59 to 69 shall be checked against the Journal Officiel before launch. | P0 | ⬜ | TBD-06 | I |

## 3.2.2 Pricing and carrier suggestion (`PRC`, service `shipping`)

| Id | Requirement | Pri | Status | Source | Ver |
|---|---|---|---|---|---|
| PRC-001 | A store shall set its own customer delivery prices per wilaya for home and stop-desk delivery (`GET/PUT /pricing/store-prices`). | P0 | ✅ | #33 | T |
| PRC-002 | A store shall keep each carrier's rate card (what the carrier charges) per wilaya and delivery type (`/pricing/rate-cards/:carrier`). | P1 | ✅ | #33 | T |
| PRC-003 | `GET /pricing/quote` shall return the price to charge for a destination and delivery type. | P0 | ✅ | #33 | T |
| PRC-004 | `GET /carriers/suggestion` shall rank connected carriers for a destination by price, measured delivery rate to that wilaya and speed, honour store routing rules, and say why (`routing_rule`, `only_option`, `cheapest`, `most_reliable`, `fastest`, `best_balance`). | P1 | ✅ | #41 | T |
| PRC-005 | Stores shall set weights and routing rules for the suggestion (`/carriers/suggestion-settings`). | P1 | ✅ | #41 | T |

## 3.2.3 Carrier accounts and adapters (`CAR`, `packages/carriers` + `shipping`)

| Id | Requirement | Pri | Status | Source | Ver |
|---|---|---|---|---|---|
| CAR-001 | Every carrier shall be reached only through the `CarrierAdapter` port (`validateCredentials`, `getRates`, `createShipment`, `findShipment`, `cancelShipment`, `getLabel`, `getTracking`, `parseWebhook`, `listStopDesks`, `mapCommune`) with declared `capabilities`. | P0 | ✅ | #30, #40 | T |
| CAR-002 | Adapters shall be stateless: decrypted credentials arrive in a `CarrierContext` on each call. | P0 | ✅ | #30 | I |
| CAR-003 | A store shall connect a carrier (`PUT /carriers/accounts/:carrier`); credentials shall be validated with the carrier, envelope-encrypted with `CARRIER_KEK` (versioned key id, previous key for rotation) and never returned by the API. | P0 | ✅ | #30 | T |
| CAR-004 | Errors shall be `CarrierError` with a `kind`; only `unavailable` and `rate_limited` are retried, with backoff. | P0 | ✅ | #30 | T |
| CAR-005 | Each carrier's status labels shall map to the nine normalised parcel statuses ignoring case and accents; unknown labels emit `shipping.carrier-status.unknown.v1`. | P0 | ✅ | #32 | T |
| CAR-006 | Every adapter shall pass the shared carrier contract suite (`packages/carriers/src/contract`). | P0 | ✅ | #40 | T |
| CAR-007 | The Yalidine adapter shall exist; it shall be verified against a sandbox with recorded, scrubbed fixtures before production use. | P0 | 🟡 | #30, TBD-04 | T |
| CAR-008 | At least two more adapters shall exist (Ecotrack platform first, then ZR Express / Maystro / NOEST). | P1 | ⬜ | #40 | T |
| CAR-009 | A fake carrier (`ENABLE_FAKE_CARRIER`) shall behave like a real one, including "timed out but created", for tests and demos. | P0 | ✅ | #30 | T |

## 3.2.4 Shipments (`SHP`, services `orders` + `shipping`)

| Id | Requirement | Pri | Status | Source | Ver |
|---|---|---|---|---|---|
| SHP-001 | `POST /orders/ship` shall take up to 100 confirmed orders, a carrier and the origin wilaya, move each to `ready_to_ship` and emit `orders.order.ship-requested.v1`; the response lists per order `requested` or the reason it was refused. | P0 | ✅ | #31 | T |
| SHP-002 | Shipping shall consume ship requests in a worker and create each parcel with `createShipmentOnce`: our reference is sent as the carrier's order id, and before each retry the carrier is asked whether the parcel already exists, so a parcel is never created twice. | P0 | ✅ | #31 | T |
| SHP-003 | On success shipping shall store the shipment (carrier, tracking number, destination, random public code) and emit `shipping.shipment.created.v1` with the COD amount; orders then moves the order to `shipped`. | P0 | ✅ | #31 | T |
| SHP-004 | On failure shipping shall emit `shipping.shipment.failed.v1` with a reason (`not_connected`, `not_supported`, `invalid_request`, `carrier_rejected`, `carrier_unavailable`); orders puts the order back to `confirmed` and shows the reason. | P0 | ✅ | #31 | T |
| SHP-005 | Packers shall print labels (single and batch PDF) and a hand-over manifest per carrier. | P0 | ⬜ | #31 | D |
| SHP-006 | A seller should cancel a parcel the carrier has not picked up yet, where the carrier supports it. | P1 | ⬜ | #31 | T |

## 3.2.5 Tracking (`TRK`, service `shipping`)

| Id | Requirement | Pri | Status | Source | Ver |
|---|---|---|---|---|---|
| TRK-001 | Shipping shall accept carrier webhooks at `POST /webhooks/:carrier/:storeId`, verify the carrier's signature when it has one, and ingest events idempotently (event key per carrier event). | P0 | ✅ | #32 | T |
| TRK-002 | A poller shall ask carriers for parcels due (`nextPollAt`): every 60 min when created or picked up, 120 min in transit, 10 min out for delivery, 30 min after a failed attempt, 240 min while returning, never once final. Carriers with webhooks are polled too as a safety net. | P0 | ✅ | #32 | T |
| TRK-003 | Each status change shall be stored as a tracking event and emit `shipping.shipment.status-changed.v1`; orders maps it to the order status (`ORDER_STATUS_FOR_PARCEL`). | P0 | ✅ | #32 | T |
| TRK-004 | `GET /tracking/orders/:orderId` shall return every shipment of an order with its normalised timeline. | P0 | ✅ | #32, #35 | T |
| TRK-005 | `GET /public/tracking/:publicCode` (no login) shall return status, carrier, tracking number, ETA and a timeline without any personal data; the code shall be random (16 to 32 characters) and not derived from the tracking number. | P0 | ✅ | #34 | T |
| TRK-006 | The system shall predict a delivery date range from the store's own history per carrier and route, skipping Fridays and public holidays. | P2 | ✅ | #55 | T |
| TRK-007 | Lunar holiday dates shall be loaded each year. | P2 | ⬜ | TBD-08 | I |
| TRK-008 | The web app shall show the timeline in the order detail and a branded public tracking page in AR/FR/EN. | P0 | ⬜ | #34, #35 | D |

## 3.2.6 COD reconciliation and money (`PAY`, service `payments`)

| Id | Requirement | Pri | Status | Source | Ver |
|---|---|---|---|---|---|
| PAY-001 | Payments shall learn about parcels only from `shipping.shipment.created.v1` (COD amount) and `shipping.shipment.status-changed.v1` (delivered, returned). | P0 | ✅ | #42, ADR-0002 | T |
| PAY-002 | `POST /payouts` shall accept one carrier statement with its lines (from an API or a parsed file), store it once per `(store, carrier, reference)` and answer `202 processing`; a worker matches it. | P0 | ✅ | #42 | T |
| PAY-003 | Each line shall be matched by `(carrier, tracking number)` as `matched`, `amount_mismatch` or `unknown_line`; `payments.payout.imported.v1` is emitted when done. | P0 | ✅ | #42 | T |
| PAY-004 | A daily sweep shall mark delivered parcels unpaid after `missingAfterDays` (default 14, 1 to 90) as `missing` and emit `payments.parcel.flagged.v1`. | P0 | ✅ | #42 | T |
| PAY-005 | Money shall be kept in a per-store double-entry ledger (`carrier_receivable`, `cash`, `carrier_fees`, `unallocated`, `written_off`) whose totals always balance. | P0 | ✅ | #42 | T |
| PAY-006 | `GET /money/summary`, `GET /money/parcels`, `GET /payouts`, `GET /payouts/:id` shall serve the totals, parcels by money state and statements (`money.read`). | P0 | ✅ | #42 | T |
| PAY-007 | Sellers shall upload a carrier statement as Excel or PDF and have it parsed into `POST /payouts`; carrier API pullers should import statements on their own. | P1 | ⬜ | #42 | T |
| PAY-008 | COD screens and the seller wallet with PDF/Excel statements shall exist in the web app. | P1 | ⬜ | #43, #44 | D |
| PAY-009 | Manual adjustments and write-offs shall need `money.manage` and be audited. | P1 | ⬜ | #42, #20 | T |
| PAY-010 | Electronic payment (CIB / Edahabia) may be offered as an alternative to COD. | P2 | ⬜ | #61 | A |

## 3.2.7 Customer notifications (`NTF`, service `notifications`)

| Id | Requirement | Pri | Status | Source | Ver |
|---|---|---|---|---|---|
| NTF-001 | Notifications shall be off per store until turned on; a store chooses the channel (SMS or WhatsApp), language (Arabic, French, Darija), triggers and quiet hours (default 21:00 to 08:00 Algiers) via `/notifications/settings`. | P1 | ✅ | #46, ADR-0004 | T |
| NTF-002 | Triggers shall be `order_confirmed`, `parcel_shipped`, `out_for_delivery`, `failed_attempt`, `parcel_delivered`, `parcel_returned`, fed by order and shipping events. | P1 | ✅ | #46 | T |
| NTF-003 | Each trigger shall queue at most one message per event; its send time is pushed past quiet hours. | P1 | ✅ | #46 | T |
| NTF-004 | A sender worker shall lease due messages with `FOR UPDATE SKIP LOCKED`, fetch the phone from orders at send time, and send through the `MessageProvider` port; message rows hold no phone or text. | P1 | ✅ | ADR-0004 | T |
| NTF-005 | Messages shall end `sent`, `delivered`, `failed` or `skipped` (`opted_out`, `disabled`, `no_contact`); delivery receipts arrive at `POST /webhooks/messages/:provider` (token-protected). | P1 | ✅ | #46 | T |
| NTF-006 | Templates per store, trigger, channel and language shall allow only `{name}`, `{ref}`, `{tracking_link}`, `{carrier}`, `{store_name}`. | P1 | ✅ | #46 | T |
| NTF-007 | Customers shall opt out; stores manage the opt-out list (`/notifications/opt-outs`). | P1 | ✅ | #46 | T |
| NTF-008 | `GET /notifications/messages` and `/usage` shall show the queue, statuses and cost per period. | P1 | ✅ | #46 | T |
| NTF-009 | A message shall reach the provider within 5 minutes of the carrier event (outside quiet hours). | P1 | 🟡 | #46 | A |
| NTF-010 | Real SMS and WhatsApp adapters shall replace the fake provider once chosen; WhatsApp templates carry their Meta approval id. | P1 | ⬜ | TBD-03 | T |
| NTF-011 | In-app notifications for sellers (new order, failed shipment, money flagged) shall exist. | P2 | ⬜ | #37 | D |

## 3.2.8 Shop integrations (`INT`, service `integrations` + `packages/connectors`)

| Id | Requirement | Pri | Status | Source | Ver |
|---|---|---|---|---|---|
| INT-001 | Every shop platform shall be reached through the stateless `StoreConnector` port; adding a platform is one class plus one registry line. | P0 | ✅ | #47, ADR-0003 | I |
| INT-002 | A store shall connect, list and remove shops (`/integrations`, `GET /integrations/connectors`); shop tokens are envelope-encrypted with `SHOP_KEK` and never returned. | P0 | ✅ | #47 | T |
| INT-003 | A worker shall poll each connection every `SYNC_INTERVAL_MINUTES` (default 5) and backfill the last `BACKFILL_DAYS` (default 30) on first connect; shop webhooks (`POST /webhooks/shops/:connectionId`, signature checked) speed it up. | P0 | ✅ | #47 | T |
| INT-004 | Each new or changed shop order shall emit `integrations.order.received.v1`; integrations never writes orders itself. | P0 | ✅ | ADR-0003 | T |
| INT-005 | Free-text province and city shall be matched to wilaya and commune codes using shipping's geography; an order that cannot be matched is held in a needs-fix queue (`/integrations/orders/needs-fix`, resolve or skip), never dropped. | P0 | ✅ | #47 | T |
| INT-006 | When a shop order is shipped, integrations shall push the tracking number and our public tracking link back to the shop. | P1 | ✅ | #47 | T |
| INT-007 | Shopify (custom-app token) and Google Sheets (service account) connectors shall exist. | P0 | ✅ | #26, #47 | T |
| INT-008 | Shopify OAuth through a partner app should replace pasted tokens. | P1 | ⬜ | TBD-09 | D |
| INT-009 | WooCommerce and YouCan connectors shall exist. | P1 | ⬜ | #48 | T |
| INT-010 | Facebook and Instagram leads may create orders automatically. | P2 | ⬜ | #60 | D |
