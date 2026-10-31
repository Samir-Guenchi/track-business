---
name: pr-workflow
description: TrackEcom Git and pull request workflow - picking an issue, branch names, Conventional Commits, PR size and template, targeting dev. Use when starting work on an issue, committing, or opening a PR.
---

# PR workflow

Full rules: `docs/WORKFLOW.md`. Dependency map and folder ownership: `docs/PARALLEL_PLAN.md`.

## Start

1. Read the issue and its "Depends on" line. Check `docs/PARALLEL_PLAN.md` that its blockers are merged.
2. `git switch dev && git pull`
3. Branch: `feat/<issue>-short-name`, `fix/<issue>-...`, `chore/<issue>-...`, `docs/<issue>-...`.

## While working

- Conventional Commits, English, imperative: `feat(orders): add bulk confirm`, `fix(shipping): map yalidine returned status`.
  Scopes: service or package name (`gateway`, `identity`, `orders`, `shipping`, `contracts`, `ui`, `web`, `config`, `ci`).
- Commit small, logical steps. A refactor goes in its own commit before the feature.
- Merge `origin/dev` into your branch at least daily. Lockfile conflict: take `dev`'s version, `pnpm install`, commit.
- Stay inside the folders your issue owns. A change to a shared root file is its own small PR.

## Open the PR

- Base **`dev`**. Never `main` (only Samir opens `dev -> main`).
- Size: under ~400 changed lines excluding lockfiles and generated files. Bigger = split it (contract PR, then implementation, then UI).
- Fill the template: what and why, `Closes #N`, how to test, checklist.
- Before pushing: `pnpm lint && pnpm typecheck && pnpm test` for touched packages.
- Request review from the other person. Squash-merge after one approval and green CI.

## Never

- Push directly to `dev` or `main`, force-push a shared branch, or merge your own PR without review.
- Disable or skip a test to get CI green.
- Commit `.env`, secrets, real phone numbers or customer data.
