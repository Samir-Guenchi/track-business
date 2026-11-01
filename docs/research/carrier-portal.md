# Carrier-side portal: design note (#59)

Status: proposal for a later ADR. Phase 4, after the beta and launch.

## Idea

Small delivery companies get a dashboard from TrackEcom. They see the parcels TrackEcom sellers send them, update statuses and upload payouts. In exchange, their sellers come to TrackEcom.

## How it fits the architecture

- **A carrier organisation is a new tenant type** in identity (`organisation.kind = store | carrier`) with its own roles: `dispatcher`, `hub_agent`, `driver`. Permissions go in the same matrix (`packages/contracts/src/stores/permissions.ts`), so services check them the same way.
- **The portal carrier is a carrier adapter like any other** (`portal` adapter in `packages/carriers`). For the seller nothing changes: they connect "Company X" in Settings and ship. The adapter writes to a new **carrier-portal service** instead of an external API; it passes the shared carrier contract suite (#40).
- **The carrier-portal service owns** the carrier's view of parcels (a copy with only what delivery needs: name, phone, address, COD), runs, driver assignments and photos. Status changes go back as the same tracking events shipping already ingests (`TrackingUpdate`), so orders, payments and notifications work unchanged.
- **Payouts**: the carrier uploads a statement through the same payout import as today (payments, #42), addressed to each seller's store.
- **Driver view**: part of `apps/mobile` (Abdennour): today's run, call the customer, mark delivered or failed with a reason and a photo (object storage, signed URLs).
- **Tenant isolation**: a carrier sees only parcels sent to it, never the seller's other orders; sellers never see other sellers through the carrier.

## Open questions for Samir

1. Pricing for carriers (free to bring sellers, or per parcel)?
2. One pilot carrier to design with.
3. Do drivers need offline mode (bad network in the south)?
