<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/brand/trackecom-logo-dark.svg">
    <img src="assets/brand/trackecom-logo.svg" alt="TrackEcom" width="420">
  </picture>
</p>

<p align="center">
  <strong>Livraison suivie, partout en Algérie.</strong><br>
  The order, delivery and cash-on-delivery platform for Algerian e-commerce.
</p>

<p align="center">
  <img alt="status" src="https://img.shields.io/badge/status-pre--alpha-E2463A">
  <img alt="market" src="https://img.shields.io/badge/market-Algeria-0E5C3F">
  <img alt="languages" src="https://img.shields.io/badge/lang-AR%20%7C%20FR%20%7C%20EN-14211B">
</p>

---

## Why TrackEcom

Online sellers in Algeria juggle several delivery companies, phone confirmations, cash-on-delivery (COD) reconciliation and a high rate of returned parcels. Existing tools mostly stop at "create a shipment and print a label".

TrackEcom aims to be the **operating system for an Algerian online store's back office**: one place to receive orders, confirm them, ship them with the best carrier for each wilaya, follow every parcel live, and get paid on time.

## What makes it different

| | Typical delivery dashboard | TrackEcom |
|---|---|---|
| Carriers | One provider, or one account per provider | Multi-carrier hub with one API and smart routing by wilaya, price and success rate |
| Order confirmation | Manual phone calls | Confirmation centre with call scripts, WhatsApp/SMS templates and agent performance |
| Returns (retour) | Discovered after the fact | **Return-risk score** per order before shipping (customer history, wilaya, product, time of day) |
| COD money | Spreadsheets | Automatic reconciliation of every carrier payout against delivered orders |
| Customer tracking | Carrier link | Branded tracking page in Arabic, French and English, with live status and delivery ETA |
| Integrations | Copy and paste | Shopify, WooCommerce, YouCan, Facebook/Instagram leads, Google Sheets and a public REST API with webhooks |
| Insights | Order counts | Delivery rate per wilaya, carrier and product, profit after shipping and returns |

## Core modules

- **Orders**: import from stores, social leads and spreadsheets; deduplication and blacklist of fake buyers.
- **Confirmation centre**: queues for confirmation agents, call outcomes, automatic reminders.
- **Shipping hub**: create shipments with several carriers, labels and manifests, stop-desk and home delivery, smart carrier suggestion.
- **Live tracking**: one normalised status timeline across carriers, customer notifications, branded tracking page.
- **Returns and COD**: return-risk score, returns workflow, payout reconciliation and seller wallet.
- **Stock**: products, variants, multi-warehouse stock that moves with each order.
- **Analytics**: delivery rate, return rate, net margin and agent productivity.
- **Developer platform**: REST API, webhooks and SDKs.

## Tech direction (proposed)

- **Web app**: Next.js + TypeScript, Tailwind, full RTL support for Arabic.
- **API**: NestJS (TypeScript) with PostgreSQL and Prisma; Redis + BullMQ for carrier sync and notification jobs.
- **Mobile**: React Native app for sellers and confirmation agents (phase 3).
- **Infra**: Docker, CI on GitHub Actions, hosting with data residency options for Algerian customers.

These choices are proposals and will be confirmed in Phase 0 of the [roadmap](ROADMAP.md).

## Repository layout

```
assets/brand/      Logo, icon and wordmark (SVG + PNG) and the generator script
BRAND.md           Logo usage, colours and typography
ROADMAP.md         Product roadmap by phase
docs/KICKOFF.md    Team kickoff (Arabic): vision, added value, who does what, Git rules, first tasks
docs/PARALLEL_PLAN.md  Issue dependencies and rules to avoid merge conflicts
docs/WORKFLOW.md   Branching, review and project board rules
.github/           CODEOWNERS, PR and issue templates, labels, workflows
```

Application code (`apps/web`, `apps/api`, `packages/*`) will be added in Phase 0.

## Brand

The mark is a hand-inked **T** whose stem is a delivery route: solid where the parcel has already travelled, dotted where it is in transit, ending on a red pulse at the customer's door. See [BRAND.md](BRAND.md) for the full kit.

| Icon | Stacked |
|---|---|
| <img src="assets/brand/trackecom-icon.svg" width="120"> | <img src="assets/brand/trackecom-stacked.svg" width="300"> |

## Roadmap

See [ROADMAP.md](ROADMAP.md).

## Contributing

Work happens on the `dev` branch. Branch from `dev`, open your pull request into `dev`, keep it small and link its issue. Only `dev` is merged into `main`, by the repository owner. See [docs/WORKFLOW.md](docs/WORKFLOW.md) for branches, labels and the project board.

## License

All rights reserved for now. A license will be chosen before the first public release.
