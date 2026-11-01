# Private beta plan (#38)

Goal: 10 or more sellers use TrackEcom every week for 4 weeks, and we record baseline numbers in ROADMAP.md.

## 1. Seller interviews (before the beta)

Ten interviews of 30 minutes, notes in `docs/research/seller-interviews.md` (template there). No names or phone numbers in the repo: sellers are "S1, S2...".

Questions:
1. How many orders a day? Where do they come from (Facebook, Instagram, landing page, Shopify, YouCan, Google Sheets)?
2. Which carriers, and why? How do you create parcels today?
3. Who confirms orders by phone, and how long does it take? What share do you cancel?
4. What share of parcels come back? What does a return cost you?
5. How do you check that the carrier paid all the COD? How long until you are paid?
6. What tool do you use (carrier dashboard, Excel, another app)? What do you pay?
7. If one thing were fixed tomorrow, what would it be?

## 2. Recruiting 10 to 20 sellers

Mix sizes (under 20, 20 to 100, over 100 orders a day) and wilayas (Alger, Oran, Constantine, the south). At least two Shopify or YouCan stores and two Google Sheets sellers to exercise the connectors. Sign a short beta agreement (free during the beta, feedback in exchange, data handled as in the privacy policy, #49).

## 3. Feedback and support

- A WhatsApp group per cohort plus a direct line.
- An in-app feedback button (owner: Abdennour, apps/web) that opens a GitHub issue labelled `beta-feedback` without personal data.
- Weekly beta review: triage `beta-feedback`, pick fixes for the next week.

## 4. Product analytics

Privacy-friendly and self-hosted if possible (PostHog self-hosted or Plausible), no customer data in events: only store id, user role and the event name. Funnels: sign up → connect carrier → first order → first parcel → first payout reconciled; daily confirmation sessions.

## 5. Baseline metrics (week 0, then weekly)

| Metric | Source in TrackEcom |
|---|---|
| Delivery rate (delivered / shipped) | shipping timeline, payments parcels |
| Return rate | parcel status `returned` |
| Confirmation time (order created → confirmed) | orders status history |
| Confirmation rate (confirmed / created) | orders |
| COD paid within 14 days | payments ledger, missing-parcel sweep |
| Weekly active sellers | analytics |

What needs Samir: recruiting sellers, running interviews, choosing the analytics tool, and the WhatsApp line.
