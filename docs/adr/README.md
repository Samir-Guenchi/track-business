# Architecture decision records

Each significant decision (new service, new infrastructure, a change of library or pattern) gets a short ADR here, numbered in order. An ADR is never rewritten once accepted; a later ADR supersedes it.

| ADR | Title | Status |
|---|---|---|
| [0001](0001-architecture-and-stack.md) | Microservices architecture and technology stack | Accepted |
| [0002](0002-payments-service.md) | A payments service for COD reconciliation | Proposed |
| [0003](0003-integrations-service.md) | Shop integrations behind a StoreConnector port | Proposed |
| [0004](0004-notifications-service.md) | A notifications service for customer SMS and WhatsApp | Proposed |
| [0005](0005-public-api.md) | Public API: API keys exchanged for tokens, outgoing webhooks | Proposed |

## Template

```markdown
# ADR-NNNN: Title

- Status: Proposed | Accepted | Superseded by ADR-XXXX
- Date: YYYY-MM-DD
- Issue: #N

## Context
What forces us to decide, constraints.

## Decision
What we chose, concretely.

## Alternatives considered
Each option and why it lost.

## Consequences
Good, bad, and how we handle the bad.
```
