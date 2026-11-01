# integrations service

Owns each store's shop connections (Shopify now, WooCommerce and YouCan next), their encrypted tokens and sync state (ADR-0003, issue #47). Port 4006.

```bash
pnpm --filter @trackecom/integrations db:migrate
pnpm --filter @trackecom/integrations dev     # http://localhost:4006/docs/openapi.json
```

- `GET /integrations/connectors` lists the platforms and the fields a seller fills. Until TrackEcom has a Shopify partner app, Shopify is connected with a custom app's Admin API access token and webhook signing secret.
- `POST /integrations` (`store.update`) checks the credentials with the shop, then seals them with AES-256-GCM envelope encryption under `SHOP_KEK`. The associated data binds each ciphertext to its row. Connecting the same shop again replaces its credentials. Reads never return them.
- `GET /integrations` shows each shop's status, last sync and orders imported; `DELETE /integrations/:id` removes the shop and its credentials.
- It never writes orders: shop orders leave as `integrations.order.received.v1` through the outbox, and orders creates them once per shop order.
- `ENABLE_FAKE_CONNECTOR=true` registers an in-memory shop (answering as `woocommerce`) for local development and tests; it is refused in production.
