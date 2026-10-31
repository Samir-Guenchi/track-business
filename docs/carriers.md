# Algerian carriers: research spike (#30)

Status: desk research on 2026-10-31 from public pages and open-source client libraries. **No carrier
sandbox has been called yet**: every API detail below must be checked against the carrier's own
docs and a sandbox account before we rely on it. Marked "(unverified)" where the only source is a
third-party library.

## Landscape

Most Algerian e-commerce parcels go through a handful of networks. Several "companies" are really
one software platform resold under different brands, so **one adapter can cover many carriers**.

| Carrier / platform | What it covers | Auth (unverified) | Notes |
|---|---|---|---|
| **Yalidine** (and Yalitec, same platform) | Home and stop-desk, 58+ wilayas, large stop-desk network | API id + API token from the merchant dashboard; API access must be enabled by Yalidine | REST at `api.yalidine.app/v1`; parcels, history, centers, wilayas, communes, fees. Only parcels "en préparation" can be edited. Quota headers per second/minute/hour/day (unverified). |
| **Ecotrack** (white-label platform) | Dozens of local companies run on it (e.g. DHD, Conexlog and many regional ones) | One API token per store and company | Same API shape for every company on the platform: one adapter, one config row per company (base URL). Rates and labels available (unverified). |
| **Procolis** (ZR Express, legacy) | ZR Express | id + token | Older ZR Express API. A newer ZR Express API identifies places by UUID territory ids instead of wilaya codes, so it needs its own mapping (unverified). |
| **Maystro Delivery** | Home and stop-desk | Token | Status updates reported to come only through webhooks; tracking and cancel calls may not exist (unverified). |
| **NOEST** | Home and stop-desk (coverage claims differ between sources) | API token + user GUID | Stop desks identified by station codes (unverified). |

Unified third-party APIs (e.g. DZBuild "dzship", Dolivroo) wrap several of these. We do **not**
build on them: it adds a middleman to every parcel and to sellers' credentials. They are still a
useful source of field mappings.

## Recommendation for the first adapter

1. **Yalidine** first, if our beta sellers use it (it is the most common network and its API can
   look a parcel up by our order id, so `createShipmentOnce` can retry safely).
2. **Ecotrack** second: one adapter unlocks many smaller companies at once.

Decision needed from Samir: which carrier our first beta sellers ship with, and a sandbox or test
merchant account for it. The adapter work (credentials vault, adapter, recorded HTTP fixtures)
starts once we have that account; fixtures must be recorded from real responses with phone
numbers and names replaced.

## How carriers plug in (`packages/carriers`)

- `CarrierAdapter` is the only thing services see:
  - `validateCredentials`, `getRates`, `createShipment`, `findShipment`, `cancelShipment`,
    `getLabel`, `getTracking`, `parseWebhook`, `listStopDesks`, `mapCommune`.
  - `capabilities` tells callers what a carrier supports (webhooks, cancel, labels, rates, lookup
    by reference) so nobody catches "not supported" errors to find out.
- Adapters are **stateless**: decrypted credentials come in a `CarrierContext` on each call, so any
  worker replica can serve any store.
- Failures are `CarrierError` with a `kind`; only `unavailable` and `rate_limited` are retried.
- `createShipmentOnce` never creates a parcel twice: it sends our `reference` as the carrier's order
  id and, before each retry, asks the carrier whether the parcel already exists. Carriers that
  cannot be searched by reference get exactly one attempt.
- `statusMapper` turns each carrier's status labels into our `ParcelStatus`, ignoring case and
  accents; unknown labels come back as `null` and are logged for mapping.
- `FakeCarrier` (`@trackecom/carriers/testing`) behaves like a real carrier (including "timed out
  but created anyway") for service tests and local development.

## Still to do in #30

- `CarrierAccount` in shipping: per-store credentials encrypted with an envelope key (see
  `secure-coding` skill), never returned by the API, decrypted only inside the worker.
- First adapter with sandbox tests and recorded HTTP fixtures.
- The shipment worker: confirmed order -> queue -> `createShipmentOnce` -> tracking number on the
  order (with #31).

## Sources

- Yalidine Laravel client (base URL, credential names): https://packagist.org/packages/terminaldz/laravel-yalidine
- DZBuild help on Yalidine API access and error codes: https://help.dzbuild.com/en/articles/16345639-yalidine
- CourierDZ (supported operations per platform): https://github.com/PiteurStudio/CourierDZ
- Vargo / uften courier libraries (Procolis vs new ZR Express, NOEST credentials): https://packagist.org/packages/kazistm/vargo, https://packagist.org/packages/uften/courier
- DZBuild couriers overview: https://dzbuild.com/docs/couriers/overview
