# ADR-0002: A payments service for COD reconciliation

- Status: Proposed
- Date: 2026-10-31
- Issue: #42

## Context

Sellers wait for carrier payouts and check them by hand in Excel, and missing money often goes unnoticed. Issue #42 asks for every delivered order to end up paid or flagged. Later work builds on the same data: COD screens (#43), the wallet (#44), analytics (#53) and e-payment (#61). ADR-0001 already names `payments` as a later service and asks for a short ADR when it starts.

## Decision

- **New service `services/payments`** (port 4004). It uses the same template as orders and shipping: NestJS on Fastify, Prisma with its own database, the service-kit store-access guard, an outbox and Redis Streams.
- **It learns about parcels only through events**, never through another database:
  - `shipping.shipment.created.v1` carries the carrier, tracking number, order and **COD amount**. A `codAmount` field is added to this v1 event before anything consumes it in production.
  - `shipping.shipment.status-changed.v1` tells it when a parcel is delivered or returned.
- **Payouts come in through `POST /payouts`.** The request is one carrier statement with its lines, in the same shape whether it came from a carrier API or a parsed Excel/PDF file. The Excel/PDF parsing and the carrier API pullers are adapters that call the same use case. A `(store, carrier, reference)` statement is imported once.
- **Matching is a pure domain function.** A statement line is matched to a parcel by `(carrier, tracking number)`. The result is `matched`, `amount_mismatch` or `unknown_line`. A scheduled job marks delivered parcels unpaid after `missingAfterDays` (default 14) as `missing`.
- **Double-entry ledger per store** with accounts `carrier_receivable`, `cash`, `carrier_fees` and `written_off`:
  - a delivery debits the receivable;
  - a payout line credits it against `cash` and `carrier_fees`.
  Totals balance by construction, and `GET /money/summary` reads them.
- **Flagged parcels emit `payments.parcel.flagged.v1`**, so notifications can alert the seller with the list to claim.

## Alternatives considered

- **Put it in shipping.** That was rejected because money has different access rules (`money.read`, accountants), a different retention period and a different growth path (wallet, e-payment). Shipping would grow into two capabilities.
- **Compute the reconciliation on read** from shipping's data, with no ledger. That was rejected because it breaks the "a service owns its data" rule. It also gives no audit trail of what was paid when.
- **A single "balance" column per store.** That was rejected because it cannot explain a gap. The ledger keeps every movement, so a total can always be traced to its parcels.

## Consequences

- One more image, database, `-migrate` job and `PAYMENTS_DATABASE_URL` secret per environment.
- Payments only sees parcels created after it is deployed. Older parcels need a one-off backfill from shipping, which is a script, not an API.
- Personal data stays out of payments: it stores tracking numbers, order ids and amounts only.
