# AGENTS.md

Guidance for every coding agent (Claude Code, Codex, Copilot, Cursor...) and every human working in this repository. Read it before writing code. If a rule here and a request disagree, ask in the PR or issue instead of guessing.

## What we are building

**TrackEcom** is the operating system for Algerian e-commerce sellers: orders, confirmation calls, multi-carrier shipping, live tracking and cash-on-delivery (COD) reconciliation in one place. See [README.md](README.md), [ROADMAP.md](ROADMAP.md) and [docs/KICKOFF.md](docs/KICKOFF.md).

## Architecture in one screen

TrackEcom is a set of **small, independently deployable services** in one monorepo. The full decision and its trade-offs are in `docs/adr/0001-architecture-and-stack.md` (issue #8).

```
apps/web            Next.js seller app (Arabic RTL, French, English)
apps/mobile         React Native app (Phase 3)
services/gateway    Public entry point: auth check, rate limits, routing (BFF)
services/<name>     One business capability each: identity, orders, shipping, notifications...
packages/contracts  zod schemas, DTOs, event payloads shared by services and apps
packages/events     Event bus interface + Redis Streams adapter, outbox helpers
packages/carriers   Carrier adapter interface and one adapter per carrier
packages/connectors Shop connector interface (Shopify, WooCommerce, YouCan)
packages/ui         Design system (React components, tokens)
packages/config     Shared tsconfig, ESLint, Prettier
```

Core rules of the architecture:

1. **A service owns its data.** One Postgres database (or schema) per service. No service reads another service's tables. Ever.
2. **Talk through contracts.** Synchronous calls use typed HTTP clients built from `packages/contracts`. Everything that can be async is a versioned domain event (`orders.order.confirmed.v1`).
3. **Services are stateless.** State lives in Postgres, Redis or object storage, so any service can run N replicas behind a load balancer.
4. **Slow or flaky work goes to a queue.** Carrier APIs, SMS, imports and reports never run inside a user request.
5. **Every row belongs to a store (tenant).** `storeId` comes from the authenticated context, never from the request body.

## Non-negotiable code rules

| Rule | Limit |
|---|---|
| File length | aim for under 150 lines, hard limit 250 (ESLint `max-lines`) |
| Function length | aim for under 20 lines, hard limit 40 |
| Parameters | 3 or fewer; pass an object beyond that |
| Cyclomatic complexity | 10 or less |
| Nesting | 3 levels or less; use early returns |
| One file | one exported class, component or cohesive group of pure functions |
| TypeScript | `strict: true`, no `any`, no `@ts-ignore`, no non-null `!` without a comment |
| Layers | `interface -> application -> domain`; `infrastructure` implements ports; `domain` imports no framework |

Details and examples live in the project skills below. Use them; they are short.

## Project skills (`.claude/skills/`)

| Skill | Use it when |
|---|---|
| [clean-code](.claude/skills/clean-code/SKILL.md) | Writing or reviewing any code: SOLID, naming, small files, error handling |
| [service-architecture](.claude/skills/service-architecture/SKILL.md) | Adding a feature, a module or a new service; deciding where code lives; scaling |
| [contract-first](.claude/skills/contract-first/SKILL.md) | Any endpoint or event shared between a service and an app or another service |
| [secure-coding](.claude/skills/secure-coding/SKILL.md) | Auth, input, tenants, secrets, personal data, webhooks, uploads, outbound HTTP |
| [testing](.claude/skills/testing/SKILL.md) | Writing tests or deciding what to test |
| [pr-workflow](.claude/skills/pr-workflow/SKILL.md) | Starting an issue, branching, committing, opening a PR |

Agents that do not load skills automatically: open the matching `SKILL.md` and follow it.

## Team and ownership

- **Samir** (`@Samir-Guenchi`): services, carriers, infra, data. Owns `.github/`, root configs and `docker-compose.yml`.
- **Abdennour** (`@newabdennour`): `apps/web`, `packages/ui`, `apps/mobile`.

Folder ownership and the dependency map are in [docs/PARALLEL_PLAN.md](docs/PARALLEL_PLAN.md). Do not edit a folder you do not own in the same PR as your feature; open a small separate PR.

## Git rules (short version)

- Branch from `dev`: `feat/<issue>-short-name`, `fix/...`, `chore/...`, `docs/...`.
- **Every PR targets `dev`.** Only Samir merges `dev -> main`.
- Small PRs (under ~400 changed lines excluding lockfiles), one issue each, `Closes #N` in the body.
- Conventional Commits: `feat(orders): add bulk status update`.
- Never commit `.env`, secrets, real phone numbers or customer data.

Full rules: [docs/WORKFLOW.md](docs/WORKFLOW.md).

## Definition of done

- [ ] `pnpm lint && pnpm typecheck && pnpm test` pass (once the monorepo from #9 exists)
- [ ] New logic has unit tests; new endpoints and events have contract tests
- [ ] Inputs validated with zod at the boundary, every query scoped by `storeId`
- [ ] No file over 250 lines, no function over 40 lines
- [ ] UI works in Arabic (RTL), French and English
- [ ] Docs or ADR updated if a decision changed
