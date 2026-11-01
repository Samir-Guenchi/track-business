# integrations service

Owns each store's shop connections (Shopify now, WooCommerce and YouCan next), their encrypted tokens and sync state (ADR-0003, issue #47). Port 4006.

```bash
pnpm --filter @trackecom/integrations db:migrate
pnpm --filter @trackecom/integrations dev     # http://localhost:4006/docs/openapi.json
```

- `GET /integrations/connectors` lists the platforms and the fields a seller fills. Until TrackEcom has a Shopify partner app, Shopify is connected with a custom app's Admin API access token and webhook signing secret.
- `POST /integrations` (`store.update`) checks the credentials with the shop, then seals them with AES-256-GCM envelope encryption under `SHOP_KEK`. The associated data binds each ciphertext to its row. Connecting the same shop again replaces its credentials. Reads never return them.
- `GET /integrations` shows each shop's status, last sync and orders imported; `DELETE /integrations/:id` removes the shop and its credentials.
- Every `SYNC_INTERVAL_MINUTES` (default 5) each shop is polled for orders changed since the last sync; the first sync reaches back `BACKFILL_DAYS` (default 30). Shops are leased with `SKIP LOCKED`, so replicas never poll the same one.
- Each shop order is matched to a wilaya and commune from shipping's geo data (a number like `16 - Alger` or a name in French or Arabic; never a guess). An order with a foreign currency, a missing or foreign phone, or an address we cannot place is kept as `needs_fix` with its problem, never dropped. `imported_orders` remembers every shop order so replays change nothing; a cancellation is sent only for an order already sent, and later shop edits are not resent.
- `POST /webhooks/shops/:connectionId` (no login) takes order events from the shop. The connector checks the signature over the raw body first (401 when it does not match), then the orders go through the same importer as polling, so a webhook and the next poll never import one order twice. Register this URL in the shop for order create, update and cancel.
- `GET /integrations/orders/needs-fix` (`orders.read`) lists held shop orders; `POST .../resolve` (`orders.write`) places the customer (the commune must belong to the wilaya, the phone may be corrected) and sends the order; `POST .../skip` never imports it. Either way the stored shop data is cleared.
- It never writes orders: shop orders leave as `integrations.order.received.v1` through the outbox, and orders creates them once per shop order.
- `ENABLE_FAKE_CONNECTOR=true` registers an in-memory shop (answering as `woocommerce`) for local development and tests; it is refused in production.
