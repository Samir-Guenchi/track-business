# TrackEcom roadmap

TrackEcom is built in phases. Each phase ends with something real sellers can use, so we learn from the market early. Dates are targets from November 2026 and will move as we learn.

**Legend:** ✅ done · 🔄 in progress · ⬜ planned

---

## Phase 0: Foundations (Nov 2026)

Goal: a solid base so features ship fast and safely.

- ✅ Brand identity: logo, icon, wordmark, colours ([BRAND.md](BRAND.md))
- ✅ README and roadmap
- 🔄 Confirm architecture (microservices) and stack (Next.js web, NestJS services, PostgreSQL, Redis) in [ADR-0001](docs/adr/0001-architecture-and-stack.md)
- ⬜ Monorepo setup (`apps/web`, `services/*`, `packages/contracts`, `packages/ui`, `packages/carriers`)
- ⬜ CI on GitHub Actions: lint, type-check, tests, preview deploys
- ⬜ Authentication, organisations (stores) and roles: owner, manager, confirmation agent
- ⬜ Design system with RTL support and AR / FR / EN translations
- ⬜ Reference data: every wilaya and its communes (kept up to date with administrative changes), stop-desk locations

## Phase 1: MVP, orders to delivery (Dec 2026 – Feb 2027)

Goal: a seller can run daily operations in TrackEcom with one carrier.

- ⬜ Orders: manual creation, CSV / Google Sheets import, statuses and history
- ⬜ Confirmation centre v1: call queue, outcomes (confirmed, no answer, cancelled), notes
- ⬜ First carrier integration: create shipment, print label, sync tracking statuses
- ⬜ Home delivery and stop-desk pricing per wilaya
- ⬜ Unified tracking timeline and a public tracking page per parcel
- ⬜ Seller dashboard: today's orders, in transit, delivered, returned
- ⬜ Private beta with 10 to 20 sellers

## Phase 2: Multi-carrier and money (Mar – May 2027)

Goal: TrackEcom becomes the hub between sellers and every major carrier.

- ⬜ Carrier adapter SDK and several more carrier integrations
- ⬜ Smart carrier suggestion by wilaya, price and historical delivery rate
- ⬜ COD reconciliation: match each carrier payout to delivered orders, flag gaps
- ⬜ Seller wallet and payout statements (PDF / Excel)
- ⬜ Returns workflow: return reasons, restock, cost of each return
- ⬜ SMS and WhatsApp notifications to customers at each status change
- ⬜ Store integrations: Shopify, WooCommerce, YouCan
- ⬜ Public launch

## Phase 3: Intelligence (Jun – Sep 2027)

Goal: help sellers avoid failed deliveries before they happen.

- ⬜ **Return-risk score** for every order, with the reasons shown to the agent
- ⬜ Shared blacklist and fake-order detection (phone patterns, duplicates)
- ⬜ Analytics: delivery rate by wilaya, carrier, product and agent; real profit after shipping and returns
- ⬜ Best time to call and automatic confirmation reminders
- ⬜ Delivery ETA prediction on the tracking page
- ⬜ Mobile app (React Native) for sellers and confirmation agents

## Phase 4: Platform and scale (Q4 2027 and beyond)

Goal: open TrackEcom to partners and larger merchants.

- ⬜ Public REST API, webhooks and developer documentation
- ⬜ Multi-warehouse stock and fulfilment partners
- ⬜ Carrier-side portal so delivery companies can use TrackEcom as their seller dashboard
- ⬜ Facebook and Instagram lead capture with automatic order creation
- ⬜ Electronic payment options (CIB / Edahabia) as an alternative to COD
- ⬜ Subscription billing and plans for sellers
- ⬜ Expansion study for other Maghreb markets

---

## Success measures

| Measure | Phase 1 target | Phase 3 target |
|---|---|---|
| Active sellers | 20 | 500 |
| Delivery rate of orders shipped through TrackEcom | Baseline | +10 points vs. baseline |
| Time to confirm an order | Under 2 hours | Under 30 minutes |
| COD payout gaps detected automatically | – | 100% |

## How we update this roadmap

The roadmap is reviewed at the end of each phase. Proposals go in a GitHub issue labelled `roadmap`.
