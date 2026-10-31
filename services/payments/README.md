# payments service

Owns each store's cash-on-delivery money: which parcels owe COD, carrier payouts and a double-entry ledger (ADR-0002, issue #42). Port 4004.

```bash
cp .env.example .env
pnpm --filter @trackecom/payments db:migrate
pnpm --filter @trackecom/payments dev     # http://localhost:4004/docs/openapi.json
```

- It learns about parcels only from shipping's events (`shipping.shipment.created.v1` with the COD amount, `shipping.shipment.status-changed.v1`), through the consumer group `payments.parcels`. A `processed_events` row is written with each change, so a redelivered event changes nothing.
- Ledger accounts: `carrier_receivable`, `cod_sales`, `cash`, `carrier_fees` and `unallocated`. Every movement is one balanced entry: a delivery debits the receivable, and a payout line credits it against cash and fees. Money that matches no parcel (an unknown line, or a transfer that differs from its lines) is credited to `unallocated`. So `expected + unallocated = received + fees + outstanding` always holds.
- `POST /payouts` (`money.manage`) stores one carrier statement and answers `202` with status `processing`. The payout matcher (a background loop, leased per statement so replicas never share one) matches each line by tracking number: `matched` when the COD is exact, `amount_mismatch` when not, `unknown_line` for a parcel we never shipped. A returned parcel that only costs a return fee stays `returned`. Then the statement is `reconciled` and `GET /payouts/:id` shows the counts. It emits `payments.payout.imported.v1` and one `payments.parcel.flagged.v1` per line to claim.
- A parcel is only moved from the status it was read in, so a delivery event and a payout never both book the same parcel; the loser retries from a fresh read.
- `GET /money/summary`, `GET /money/parcels?status=&carrier=`, `GET /payouts` and `GET /money/settings` need `money.read` (owner, manager, accountant); `PUT /money/settings` and `POST /payouts` need `money.manage`.
- The missing-parcel sweep runs every 10 minutes: a delivered parcel still unpaid after the store's `missingAfterDays` (default 14) becomes `missing` and emits `payments.parcel.flagged.v1`. A later payout line clears it to `matched`.
- Parcels shipped before this service was deployed are unknown to it, and need a one-off backfill.
