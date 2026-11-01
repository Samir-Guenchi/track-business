# Delivery ETA (#55)

Status: **v1 shipped**. Accuracy has not been measured on real parcels yet.

## What v1 does

The tracking page (`GET /public/tracking/:code`) and the order timeline (`GET /tracking/orders/:id`) show an `eta`, such as `{ earliest: "2026-11-05", latest: "2026-11-08" }`. The app displays it as "Thursday to Sunday".

- **Model:** for each carrier and destination wilaya, v1 takes the parcels delivered in the last 90 days, at most the 500 newest. For each one, it counts the **delivery days** from hand-over (the first pick-up or in-transit scan, else creation) to delivery.
- **Delivery days** skip Fridays and public holidays (`services/shipping/src/modules/eta/domain/algeria-calendar.ts`). Religious holidays are expected dates. Update them when the ministry confirms each one, and add the next year every December.
- **Range:** the 10th to the 90th percentile, so about 80% of parcels should land inside it.
- **Only when confident:** the range needs at least 20 past parcels and must span at most 2 delivery days. Otherwise `eta` is `null`, as it is for parcels not handed over yet or already final.
- A late parcel never shows a date that has already passed: the range moves forward to today or tomorrow.
- Transit times are pooled across stores. They describe the carrier, and only dates leave the query.

## Not in v1

- **Delivery type (home or stop-desk) and origin wilaya:** shipments do not store them yet. Add them to the shipment (and to `shipping.shipment.created.v1`) to make the key `(carrier, from, to, type)`.
- **Measured accuracy:** `shareInsideRange` in `domain/eta.ts` computes the acceptance metric (target 80% inside). Run it monthly on the parcels delivered that month, using the ETA each one showed at hand-over, and record the results here.
