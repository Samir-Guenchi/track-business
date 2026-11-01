# Adding a carrier

A carrier is one adapter class in `packages/carriers` plus one registry line in shipping. Orders, payments and the web app never change (#40). The research notes per carrier are in [../carriers.md](../carriers.md).

## Before you write code

1. **Get a sandbox or test merchant account.** Never build against a seller's live account.
2. **Record real responses.** Record one of each: create, find by reference, history, label, cancel, an error, and a webhook if the carrier has them. Replace every name, phone and address with test values before committing. Save them as fixtures next to the adapter.
3. **Write down the carrier's status labels.** Map each one to our `ParcelStatus` in `<carrier>-statuses.ts`. A label you cannot map stays `null`: the raw text is kept on the timeline and alerted, never guessed.

## The adapter

Create `packages/carriers/src/<carrier>/` with these files:

| File | What goes in it |
|---|---|
| `<carrier>.adapter.ts` | `class <Carrier>Adapter implements CarrierAdapter` |
| `<carrier>.types.ts` | the carrier's own JSON shapes, nothing else |
| `<carrier>-parcel.ts` | `ShipmentRequest` to the carrier's create body |
| `<carrier>-statuses.ts` | labels to `ParcelStatus` and failure reasons |
| `<carrier>-fake-api.testkit.ts` | an in-memory fake of the API, built from the recorded responses |
| `<carrier>.adapter.spec.ts` | carrier-specific tests, plus the shared contract (below) |

The rules every adapter follows:

- **Stateless.** Credentials arrive in `CarrierContext` on every call. Never keep them in a field.
- **Typed errors only.** Throw `CarrierError` with a kind: `auth`, `validation`, `not_found`, `rate_limited`, `unavailable` or `not_supported`. Use `CarrierHttp`; it maps HTTP statuses and `Retry-After` for you.
- **Honest capabilities.** If the carrier cannot cancel, print labels, quote rates, send webhooks or find a parcel by our reference, set that capability to `false`. Those methods then throw `not_supported`. Callers check capabilities instead of catching errors.
- **Our reference is the carrier's order id.** Then `findShipment` can find a parcel that a timed-out create already made, and `createShipmentOnce` never ships twice. If the carrier cannot search by reference, set `findByReference: false`: creates are then tried once and never retried.
- **Webhooks verify first.** Check the signature over the raw body before parsing anything. A wrong signature is `CarrierError('auth')`.
- **Times in UTC.** Algerian carriers usually send local time without a zone. Convert it with `+01:00`.

## The shared contract

Every adapter spec runs the same suite, so a new carrier behaves like the others:

```ts
import { carrierContract } from '../contract/carrier-contract.testkit.js';
import { ecotrackHarness } from './ecotrack-fake-api.testkit.js';

carrierContract('EcotrackAdapter', () => ecotrackHarness(request));
```

The harness gives the suite the adapter on its fake API, good and bad credentials, a shipment request, a tracked parcel number, a way to make the next create save and then time out, and signed and forged webhooks when the carrier has them. The suite checks:

- credential fields and a lowercase code;
- `validateCredentials` answers `false` for wrong credentials and never throws;
- a created parcel is found again by our reference, and never created twice after a timeout;
- tracking scans come back oldest first, each mapped or kept raw;
- forged webhooks are refused (or the adapter says it has no webhooks);
- labels, cancel and rates exist exactly when the capabilities say so.

`*.testkit.ts` files are left out of the published build.

## Plug it in

1. Export the adapter from `packages/carriers/src/index.ts`.
2. Add it to `carrierAdapters()` in `services/shipping/src/modules/carriers/infrastructure/carriers.providers.ts`.
3. Ship it disabled for sellers until it has passed against the sandbox; then add a row to the table in `docs/carriers.md`.

Nothing else changes: the seller connects the carrier in Settings, and shipping uses it through the registry.
