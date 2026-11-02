# 1. Introduction

[Back to contents](README.md)

## 1.1 Purpose

This document specifies the software requirements of **TrackEcom**, the back-office platform for Algerian online sellers. It is written for:

- **The two developers** (Samir for services, carriers, infra and data; Abdennour for the web app, the design system and mobile), as the reference for what each service and screen must do.
- **Coding agents** working in the repository, together with `AGENTS.md` and the project skills.
- **Beta sellers, reviewers and future partners** who need a precise statement of behaviour (for example, what happens to an order the carrier never pays for).
- **Legal and compliance review** of personal data handling under Algerian Law 18-07.

It records the system as built in `dev` on 2026-11-01 and the requirements still planned in `ROADMAP.md` and issues #3 to #63, with a status on every requirement.

## 1.2 Scope

TrackEcom receives an online order, helps the seller confirm it by phone or by a customer link, ships it with the best carrier for the destination, follows the parcel until it is delivered or returned, tells the customer at each step and checks that the carrier pays the cash collected.

**In scope**

- Multi-tenant seller accounts (stores), team members and roles.
- Orders from manual entry, Shopify, Google Sheets and later WooCommerce, YouCan, CSV, social leads and a public API.
- A confirmation centre: call queue, call outcomes, scripts, best time to call, self-confirmation links.
- Fake-order detection, store blacklist and a return-risk score with reasons.
- Reference geography: 69 wilayas, 1,541 communes, stop desks, carrier code mappings.
- Pricing per store and carrier rate cards; carrier suggestion by price, delivery rate and rules.
- Carrier accounts, parcel creation, tracking by webhook and polling, ETA, public tracking page.
- COD reconciliation with a double-entry ledger, payout import and missing-money detection.
- Customer SMS and WhatsApp messages (provider still to choose).
- Shop integrations that pull orders and push tracking back.
- Later: analytics, products and stock, returns workflow, wallet, mobile app, public API and outgoing webhooks, carrier portal, e-payment, billing.

**Out of scope**

- Being a carrier: TrackEcom never moves parcels or holds sellers' cash.
- A storefront or checkout for end customers.
- Marketplace features between sellers.
- Accounting and tax filing beyond exporting statements.

**Benefits and goals** (from `ROADMAP.md`): 20 active sellers in Phase 1 and 500 in Phase 3; delivery rate of shipped orders +10 points vs. baseline by Phase 3; time to confirm under 2 hours (Phase 1) then under 30 minutes (Phase 3); 100% of COD payout gaps found automatically.

## 1.3 Definitions, acronyms and abbreviations

| Term | Meaning |
|---|---|
| **Store** | A seller's business; the tenant. Every row of business data carries a `storeId` |
| **Seller / owner** | The person who created the store and holds the `owner` role |
| **Member** | A user with a role in a store: owner, manager, confirmation agent, warehouse/packer, accountant |
| **Customer** | The buyer who receives the parcel; never a user of the seller app |
| **Order** | A customer's purchase, with items, address, COD amount and a status (see `docs/order-status.md`) |
| **Parcel / shipment** | The carrier's physical package for an order; an order can have several over time (re-shipping) |
| **Carrier** | A delivery company (Yalidine, Ecotrack-based companies, ZR Express, Maystro, NOEST...) |
| **COD** | Cash on delivery: the carrier collects cash from the customer and later pays the seller |
| **Payout / statement** | A carrier's payment to the seller and the list of parcels it covers |
| **Stop desk** | A carrier office where the customer picks up the parcel instead of home delivery |
| **Wilaya / commune** | Algerian province (69 since 2025) and municipality (1,541) |
| **Retour** | A returned parcel: refused or not collected, sent back to the seller |
| **Confirmation** | Calling the customer before shipping to check the order is real |
| **Darija** | Algerian spoken Arabic, used in call scripts and messages |
| **Outbox** | A table written in the same transaction as a business change, relayed later to the event bus |
| **Event** | A versioned domain fact on Redis Streams, named `<service>.<entity>.<verb>.v<N>` |
| **KEK** | Key-encryption key used for envelope encryption of carrier and shop credentials |
| **JWKS** | JSON Web Key Set published by identity so other services verify access tokens locally |
| **BFF** | Backend for frontend: the gateway shaping the API for the web and mobile apps |
| **ADR** | Architecture decision record in `docs/adr/` |
| **RTL** | Right-to-left layout for Arabic |
| **IDOR** | Insecure direct object reference: reading another store's record by guessing its id |
| **SSRF** | Server-side request forgery |
| **DZD** | Algerian dinar; all amounts are whole dinars |

## 1.4 References

| Ref | Document |
|---|---|
| R1 | `README.md`, `ROADMAP.md`, `docs/KICKOFF.md` (Arabic) |
| R2 | `AGENTS.md` and `.claude/skills/*` (code, security and testing rules) |
| R3 | ADR-0001 microservices and stack; ADR-0002 payments; ADR-0003 integrations; ADR-0004 notifications; ADR-0005 public API (`docs/adr/`) |
| R4 | `docs/order-status.md`, `docs/permissions.md`, `docs/audit-log.md` |
| R5 | `docs/carriers.md`, `docs/carriers/adding-a-carrier.md`, `docs/data-sources.md` |
| R6 | `docs/runbook.md`, `docs/launch-checklist.md`, `docs/beta-plan.md` |
| R7 | `docs/research/*` (risk score, delivery ETA, e-payment, carrier portal, Maghreb, seller interviews) |
| R8 | `docs/PARALLEL_PLAN.md`, `docs/WORKFLOW.md` |
| R9 | `docs/architecture/diagrams.md` (architecture diagrams for this SRS) |
| R10 | Algerian Law 18-07 (2018) on the protection of personal data, as amended by Law 25-11 |
| R11 | ISO/IEC/IEEE 29148:2018, IEEE Std 830-1998 |
| R12 | GitHub issues #3 to #7 (phase epics) and #8 to #63 |

## 1.5 Overview of the rest of this document

Section 2 describes the product in context: who uses it, where it runs and what limits it. Sections 3.1 to 3.6 give the specific requirements, grouped by business capability, which is also how the services are split. Section 4 tells how each requirement is verified, traces it to its issue and code, and lists the open questions.
