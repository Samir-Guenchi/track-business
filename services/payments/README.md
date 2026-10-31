# payments service

Owns each store's cash-on-delivery money: which parcels owe COD, carrier payouts and a double-entry ledger (ADR-0002, issue #42). Port 4004.

```bash
cp .env.example .env
pnpm --filter @trackecom/payments db:migrate
pnpm --filter @trackecom/payments dev     # http://localhost:4004/docs/openapi.json
```

- It learns about parcels only from shipping's events (`shipping.shipment.created.v1` with the COD amount, `shipping.shipment.status-changed.v1`), through the consumer group `payments.parcels`. A `processed_events` row is written with each change, so a redelivered event changes nothing.
- Ledger accounts: `carrier_receivable`, `cod_sales`, `cash` and `carrier_fees`. Every movement is one balanced entry: a delivery debits the receivable, and a payout line credits it against cash and fees. So `expected = received + fees + outstanding` always holds.
- `GET /money/summary` needs `money.read` (owner, manager, accountant).
- Parcels shipped before this service was deployed are unknown to it, and need a one-off backfill.
