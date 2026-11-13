# TrackEcom: Software Requirements Specification (SRS)

| | |
|---|---|
| Product | TrackEcom: order, confirmation, multi-carrier shipping, tracking and COD platform for Algerian e-commerce |
| Document | Software Requirements Specification, version 1.0 |
| Date | 2026-11-01 |
| Baseline | Branch `dev` at commit `83988fe` (PRs #67 to #127 merged), `ROADMAP.md`, ADR-0001 to ADR-0005, issues #3 to #63 |
| Owner | Samir Guenchi (`@Samir-Guenchi`) |
| Contributors | Abdennour (`@newabdennour`) for the web, design system and mobile parts |
| Structure | ISO/IEC/IEEE 29148:2018 software requirements content, laid out like IEEE 830 |

This SRS describes **what TrackEcom must do and how well**, written against what is actually built in `dev` today and what the roadmap and issues still plan. The architecture behind it is drawn in [docs/architecture/diagrams.md](../architecture/diagrams.md).

## Contents

| # | Section | File |
|---|---|---|
| 1 | Introduction: purpose, scope, definitions, references | [01-introduction.md](01-introduction.md) |
| 2 | Overall description: product perspective, functions, users, environment, constraints, assumptions | [02-overall-description.md](02-overall-description.md) |
| 3.1 | Functional requirements, part A: identity, stores, orders, confirmation, fraud and risk | [03-functional-core.md](03-functional-core.md) |
| 3.2 | Functional requirements, part B: shipping, tracking, payments, notifications, integrations | [04-functional-operations.md](04-functional-operations.md) |
| 3.3 | Functional requirements, part C: gateway, web, mobile, public API and later phases | [05-functional-platform.md](05-functional-platform.md) |
| 3.4 | External interface requirements: UI, HTTP API, events, carriers, shops, providers | [06-external-interfaces.md](06-external-interfaces.md) |
| 3.5 | Quality attributes: performance, reliability, security, privacy, scalability, maintainability | [07-quality-attributes.md](07-quality-attributes.md) |
| 3.6 | Data requirements: data owned by each service, retention, personal data | [08-data-requirements.md](08-data-requirements.md) |
| 4 | Verification, traceability matrix and open issues | [09-verification-traceability.md](09-verification-traceability.md) |

## How to read a requirement

Every requirement has an id, a statement using **shall** (mandatory), **should** (desired) or **may** (optional), a priority, a status and its source.

| Field | Values |
|---|---|
| Id | `<AREA>-<NNN>`, e.g. `ORD-004`. Ids never change meaning; a dropped requirement is marked *Withdrawn*, not reused |
| Priority | **P0** must exist for the phase to ship, **P1** important, **P2** nice to have |
| Status | ✅ **Built** (code and tests in `dev`), 🟡 **Partial** (built, with a named gap), ⬜ **Planned** (roadmap or issue, no code yet) |
| Source | Issue number(s) and/or ADR |
| Verification | **T** automated test, **D** demonstration, **I** inspection (code, config or document), **A** analysis |

Areas: `IAM` identity and access, `STO` stores and team, `AUD` audit, `ORD` orders, `CNF` confirmation, `FRD` fraud and blacklist, `RSK` return-risk score, `GEO` reference geography, `PRC` pricing, `CAR` carriers, `SHP` shipments, `TRK` tracking, `PAY` payments and COD, `NTF` notifications, `INT` shop integrations, `GW` gateway, `WEB` web app, `MOB` mobile, `API` public API, `ANL` analytics, `STK` products and stock, `BIL` billing, `NFR-*` non-functional.

## Keeping this document true

- A PR that changes behaviour covered here updates the matching requirement and its status in the same PR.
- A requirement moves to ✅ only when the code and its tests are merged into `dev`.
- When a decision changes, write or update an ADR first and link it from the requirement.
- Section 4 lists every open question (`TBD-*`) that blocks a requirement; close them there.
