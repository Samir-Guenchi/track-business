---
name: testing
description: TrackEcom testing strategy - what to test at each layer, tools (Vitest, Supertest, Testcontainers, Playwright), naming and fixtures. Use when writing or reviewing tests or deciding what a change needs.
---

# Testing

Tests are how two people change code quickly without breaking each other's work.

## What to test where

| Layer | Test type | Tool | Rule |
|---|---|---|---|
| `domain/` | Unit | Vitest | Every rule and status transition. No mocks needed; it is pure code. |
| `application/` (use cases) | Unit with fakes | Vitest | Use in-memory fakes of ports, not mocking libraries on concrete classes. |
| `infrastructure/` | Integration | Vitest + Testcontainers (Postgres, Redis) | Real database. Includes the cross-tenant test. |
| `interface/` (HTTP) | API | Supertest | Status codes, validation errors, auth/role guards. |
| Contracts | Contract | Vitest | Responses and events parse with the `packages/contracts` schema. |
| Carrier adapters | Adapter | Vitest + recorded fixtures | Status mapping for every carrier status; no live calls in CI. |
| Web | Component + E2E | Vitest/Testing Library, Playwright | Key flows in `ar` (RTL) and `fr`. |

## Rules

- Test behaviour, not implementation: assert outputs and emitted events, not private calls.
- One behaviour per test. Name: `it('rejects confirmation when the order is already shipped')`.
- Arrange / Act / Assert, separated by a blank line. Builders for test data (`anOrder().confirmed().build()`).
- Deterministic: inject a `Clock` and ID generator; no `Date.now()` or random in assertions; no sleeps.
- No network in unit tests. No real secrets, phone numbers or customer data in fixtures.
- Test files sit next to the code: `confirm-order.use-case.spec.ts`. Integration tests end in `.int.spec.ts`.
- A bug fix starts with a failing test that reproduces it.
- Coverage is a signal, not a goal; aim for 80%+ on `domain/` and `application/`.

## Minimum for a PR

- New use case: unit tests for success and each domain error.
- New endpoint: API test for 2xx, 400 (validation), 401/403 (auth/role) and cross-store access.
- New event: contract test for the payload; consumer test proving idempotency (same event twice).
