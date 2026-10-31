# ADR-0003: Shop integrations behind a StoreConnector port

- Status: Proposed
- Date: 2026-10-31
- Issues: #47 (Shopify), #48 (WooCommerce, YouCan)

## Context

Sellers run their storefront on Shopify, WooCommerce or YouCan and retype orders into TrackEcom. #47 and #48 ask for orders to arrive on their own within a minute, never duplicated, and for the tracking number to go back to the shop once shipped. The plan (docs/PARALLEL_PLAN.md) has Samir merge the connector interface first so Abdennour can build WooCommerce and YouCan on it.

## Decision

- **`packages/connectors`** holds the `StoreConnector` port, the shared types (`ExternalOrder`, `Fulfilment`...), `ConnectorError` and a registry. It is the same pattern as `packages/carriers`:
  - connectors are stateless and receive the shop and its secrets on every call;
  - adding a platform is one class plus one registry line.
- **A new `services/integrations`** owns connections and sync state:
  - encrypted shop tokens, with the same envelope encryption as carrier accounts;
  - webhook endpoints, the backfill and polling loops, and the last sync and error per shop.
  It never writes orders itself.
- **Orders arrive as events.** For each new or changed shop order, integrations emits `integrations.order.received.v1` through its outbox. Orders consumes it and creates the order with `source` = the platform and `externalRef` = the platform id. The existing `(store, source, externalRef)` rule makes a replay or a webhook-plus-backfill overlap a no-op.
- **Address matching** (free-text province and city to wilaya and commune codes) happens in integrations, with suggestions. An order it cannot match is still imported, flagged for the seller to fix, never dropped.
- **Tracking goes back** when integrations consumes `shipping.shipment.created.v1` for an order it imported: it calls `pushFulfilment` with our public tracking link.

## Alternatives considered

- **A module inside orders.** Fewer moving parts. It was rejected because shop OAuth, webhooks and rate-limited polling are slow and flaky outbound work, and ADR-0001 keeps that out of the orders request path. A Shopify outage must not slow down order screens.
- **Integrations calls `POST /orders` over HTTP.** It would need a service identity, and a retry could duplicate an order. Events plus `externalRef` give idempotency for free.

## Consequences

- One more service, database and `INTEGRATIONS_DATABASE_URL`, plus a key-encryption key for shop tokens.
- Customer name, phone and address travel in `integrations.order.received.v1`. Streams are capped with `MAXLEN` and consumers store only what they own. No other event carries contact details.
- Shopify needs a partner app (client id and secret, approved scopes) before OAuth works. Until then, connectors are built and tested against recorded payloads and the fake connector.
