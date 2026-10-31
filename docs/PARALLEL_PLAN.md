# Parallel work plan (Samir + Abdennour)

Goal: both people work at the same time and every PR merges into `dev` without conflicts.

## Why conflicts happen and how we avoid them

Git conflicts come from **two branches editing the same file at the same time**, not from two people working on the same feature. So we split by **folders**, agree on **contracts first**, and keep the few shared files tiny.

### 1. Folder ownership

| Folder | Main owner | The other person may... |
|---|---|---|
| `services/<service>/src/modules/<module>/` | owner of the issue | edit only through a PR reviewed by the owner |
| `services/<service>/prisma/` | owner of the service (Samir for the first five services) | same |
| `apps/web/app/[locale]/(app)/<feature>/` | owner of the issue | same |
| `packages/ui/` | Abdennour | add a component in a new file |
| `packages/carriers/`, `packages/events/` | Samir | - |
| `packages/contracts/src/<module>/` (zod schemas, types, status enums, events) | owner of the API part | read only |
| `.github/`, `docker-compose.yml`, root configs, `packages/config/` | Samir | propose in a small separate PR |
| `apps/mobile/` | Abdennour | - |

Architecture and service list: [ADR-0001](adr/0001-architecture-and-stack.md). Coding rules: [AGENTS.md](../AGENTS.md).

### 2. Rules that remove the usual hotspots

1. **One database and Prisma schema per service.** `services/orders/prisma/` belongs to `orders` only. Inside a service, use Prisma's multi-file schema (`prisma/schema/orders.prisma`, `products.prisma`, ...) so nobody edits a giant file. No service reads another service's tables.
2. **One translation file per feature.** `apps/web/messages/{ar,fr,en}/orders.json`, `confirmation.json`... never one big `ar.json`.
3. **Contract first.** For any feature with an API and a UI part, the API owner opens a tiny PR with only the zod schemas / types / events in `packages/contracts/src/<module>/` (and an OpenAPI stub). It is merged the same day. Then API and UI are built **in parallel**; the UI uses MSW mocks until the real endpoint lands.
4. **Lockfile.** Never hand-resolve `pnpm-lock.yaml`. If it conflicts: take `dev`'s version, run `pnpm install`, commit.
5. **Small PRs, merged within 2 days.** Before opening a PR: `git fetch && git merge origin/dev`. Long-lived branches are what create conflicts.
6. **Routes and menus.** Each feature registers itself in its own file (`apps/web/config/nav/<feature>.ts`, `services/<service>/src/modules/<module>/<module>.module.ts`); the root files only import a list that changes one line at a time.
7. **Migrations.** Only the API owner of a module creates its migration; pull `dev` and run `prisma migrate dev` right before creating one so timestamps don't clash.

## Dependency map

Legend: **⇢ blocked by**. Issues with no arrow can start as soon as their wave starts.

### Phase 0, wave A (days 1 to 3): nothing else can start until the monorepo exists

| Samir | Abdennour |
|---|---|
| #8 ADR stack (both review) | Design spec only, no code: wireframes for orders (#23), confirmation workspace (#29), tracking page (#34), dashboard (#36) in `docs/design/` |
| #9 Monorepo ⇢ #8 (keep it a bare skeleton so it merges in 1 to 2 days) | Design tokens spec for #14 in `docs/design/tokens.md` |

### Phase 0, wave B (after #9 is merged): fully parallel, disjoint folders

| Samir (`services/*`, `.github`, infra) | Abdennour (`apps/web`, `packages/ui`) |
|---|---|
| #10 CI ⇢ #9 | #13 Web skeleton, RTL, i18n ⇢ #9 |
| #12 API skeleton ⇢ #9 | #14 Design system ⇢ #9 |
| #19 Wilayas and communes ⇢ #12 | #11 Docker Compose ⇢ #9 (root files only: tell Samir before touching `package.json` scripts) |
| #15 Auth API ⇢ #12 | #16 Auth screens ⇢ #13, #14, contract of #15 |
| #17 Stores and roles ⇢ #15 | #18 Team settings UI ⇢ #13, contract of #17 |
| #20 Audit log ⇢ #12 | |
| #21 Staging, Sentry, backups ⇢ #10 | |

### Phase 1: contract first, then API and UI in parallel

| Feature | Samir | Abdennour | Order |
|---|---|---|---|
| Orders | #22 Orders API ⇢ #17, #19 | #23 Orders list/detail, #24 Order form | Samir merges the orders contract first, then both in parallel |
| Products | (review) | #27 Products, full stack, own module ⇢ #22 contract | Can run parallel to #22 because it lives in `modules/products` |
| Import | #26 Google Sheets ⇢ #25 mapping | #25 CSV/Excel import ⇢ #22 | #25 first, #26 reuses its mapping |
| Confirmation | #28 Confirmation API ⇢ #22 | #29 Agent workspace ⇢ #28 contract | parallel |
| Shipping | #30 Carrier adapter ⇢ #22, #33 Prices ⇢ #19, #32 Tracking sync ⇢ #30 | #31 Shipments and labels ⇢ #30 contract | parallel after the adapter contract |
| Tracking | (#32) | #34 Public tracking page, #35 Timeline ⇢ #32 contract | parallel with #32 on mocks |
| Dashboard | (review aggregation queries) | #36 Dashboard ⇢ #22 | any time after #22 |
| Notifications | | #37 In-app notifications ⇢ #32 events | late Phase 1 |
| Product | #38 Private beta | #39 Landing page (separate route group, no dependency) | #39 can start in wave B |

### Phase 2

| Samir | Abdennour | Notes |
|---|---|---|
| #40 Carrier SDK + 3 carriers ⇢ #30 | #45 Returns ⇢ #32 | independent modules |
| #41 Smart carrier suggestion ⇢ #40, #33 | #43 COD screens ⇢ #42 contract | |
| #42 COD reconciliation ⇢ #32 | #44 Wallet ⇢ #42 | #42 contract first |
| #46 SMS / WhatsApp ⇢ #32 | #48 WooCommerce + YouCan ⇢ #47 `StoreConnector` interface | Samir merges the interface from #47 first |
| #47 Shopify | | |
| #49 Launch checklist ⇢ all P0 of Phase 2 | | |

### Phase 3

| Samir | Abdennour |
|---|---|
| #50 Risk score ⇢ #28, #32 data | #51 Risk UI ⇢ #50 contract |
| #52 Blacklist ⇢ #22 | #53 Analytics ⇢ #22, #42 |
| #54 Best time to call ⇢ #28 | #56 Mobile app ⇢ #22, #28 contracts (own folder, very low conflict risk) |
| #55 ETA ⇢ #32 history | |

### Phase 4

All independent modules: #57 Public API (Samir), #58 Warehouses (Abdennour) ⇢ #27, #59 Carrier portal (Samir) ⇢ #40, #60 Social leads (Abdennour) ⇢ #22, #61 E-payment (Samir) ⇢ #42, #62 Billing (Abdennour) ⇢ #17, #63 Maghreb study (Samir).

## Pairs to never run at the same time

| Pair | Why | Do instead |
|---|---|---|
| #9 and anything with code | #9 creates every root file | wait for #9 |
| #10 CI and #11 Docker | both edit root `package.json` scripts | merge #10 first, or agree script names upfront |
| #22 and #27 | order items reference products | Samir defines `productId` in the orders contract, #27 adds the products module |
| #25 and #26 | #26 reuses #25's column mapping | #25 first |
| #47 and #48 | #48 implements #47's interface | interface PR first |
| #50 and #52 | both read customer phone history | #52 owns the `phone_hash` table, #50 reads it |

## Merging to `main`

`dev` -> `main` only by Samir, at the end of each wave (when `dev` is green and demo-able). Never cherry-pick feature branches into `main`.
