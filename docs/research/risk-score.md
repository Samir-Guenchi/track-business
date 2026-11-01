# Return-risk score (#50)

Status: **v1 (rules) shipped, not yet evaluated on real data.**

## What v1 does

`GET /orders/:id/risk-score` (orders service, `orders.read`) answers a score from 0 to 100, a level, and the three reasons that weigh most. Each reason comes with a sentence in Arabic, French and English. The score is computed on read, so it always uses the latest history. The rules live in `services/orders/src/modules/risk-score/domain/return-risk.ts` and are versioned as `rules-v1`.

| Signal | Points | Notes |
|---|---|---|
| This phone had parcels returned at this store (last 365 days) | +30 each, max +45 | the strongest signal in every COD market |
| This phone had parcels delivered at this store | −10 each, max −25 | |
| Shared refusal signal (`network_refusals` flag, #52) | +25 | off until the privacy decision |
| The store's return rate to the wilaya (last 180 days, from 20 finished parcels) | (rate − 20%) × 100, max +25 | |
| COD amount ≥ 15,000 DZD / ≥ 30,000 DZD | +10 / +15 | |
| Ordered between 00:00 and 06:00 Algiers time | +5 | |
| Unreached calls ≥ 2 | +5 each, max +20 | |
| Fake-order flags: blacklisted / suspicious phone / gibberish name / impossible address / burst | +40 / +20 / +15 / +15 / +10 | |
| Possible duplicate | +10 | |

Levels are: low below 30, medium from 30 to 59, and high from 60.

The weights are a starting guess, so they need checking against real data. Product return rate is not in v1, because products are only free text until the catalogue (#27) exists.

## How to evaluate it

The pure functions in `domain/evaluation.ts` give the numbers the acceptance criterion asks for:

- `returnsCapturedAtTop(outcomes, 0.2)`: the share of all returns found in the riskiest 20% of orders. The target is **≥ 0.5**.
- `alertQuality(outcomes, threshold)`: precision and recall when every order at or above the threshold raises an alert.

Steps, once beta stores (#38) have 2 to 3 months of finished orders:

1. Export the finished orders (delivered or returned) of consenting stores. Score each one with the facts **as they were when it was created**, so no later history leaks into the score.
2. Report `returnsCapturedAtTop` and `alertQuality` at 30 and 60, overall and per store, in this file.
3. Tune the weights, or move to v2: a gradient-boosted model trained offline on the same features and served behind the same endpoint. Bump `model` when that happens.

## Privacy

- Every query in v1 is scoped to the caller's store.
- The only cross-store input is the `network_refusals` flag. It is computed from a count, never shows another store, and is disabled by default (`NETWORK_SIGNAL_ENABLED`).
- No raw phone number leaves the store.
