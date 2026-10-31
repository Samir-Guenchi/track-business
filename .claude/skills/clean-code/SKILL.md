---
name: clean-code
description: TrackEcom clean code rules - SOLID, small files and functions, naming, error handling and TypeScript strictness. Use whenever writing, refactoring or reviewing any TypeScript in this repo.
---

# Clean code for TrackEcom

Write code a teammate can read in one pass. When in doubt, choose the more boring option.

## Size limits (enforced by ESLint once #9 lands)

- File: aim < 150 lines, hard limit **250**. Split by responsibility, not by line count.
- Function: aim < 20 lines, hard limit **40**. Extract named helpers.
- Parameters: **3** max. Beyond that, pass one typed object.
- Complexity: **10** max, nesting **3** max. Prefer early returns and lookup tables over `if/else` chains and `switch` on types.
- One exported class, React component or cohesive set of pure functions per file. File name = main export in kebab-case (`confirm-order.use-case.ts`).

## SOLID, applied here

| Principle | What it means in this repo | Smell |
|---|---|---|
| **S**ingle responsibility | One use case per class (`ConfirmOrderUseCase`), one controller per resource, one adapter per carrier | A service class named `OrdersService` with 15 methods |
| **O**pen/closed | New carrier = new class implementing `CarrierAdapter`, registered in a map. No editing a `switch (carrier)` | `if (carrier === 'yalidine') ... else if ...` |
| **L**iskov | Every `CarrierAdapter` honours the same contract: same errors, same status mapping, no "not supported" throws for required methods | An adapter that throws `NotImplemented` for `createShipment` |
| **I**nterface segregation | Small ports: `OrderReader`, `OrderWriter`, `EventPublisher`, not one `OrderRepository` with 20 methods | A test double that must stub methods it never uses |
| **D**ependency inversion | Use cases depend on interfaces (ports) declared in `application/ports/`; Nest DI binds the Prisma/HTTP implementation | `import { PrismaClient }` inside `domain/` or `application/` |

## Layers inside a service module

```
modules/<feature>/
  domain/          entities, value objects, domain errors, pure rules. No Nest, Prisma, HTTP.
  application/     use cases (one per file) + ports/ (interfaces). Depends on domain only.
  infrastructure/  Prisma repositories, HTTP clients, event publishers. Implements ports.
  interface/       controllers, event consumers, request/response mapping.
  <feature>.module.ts
```

Dependencies only point inward: `interface -> application -> domain`, `infrastructure -> application/domain`.

## Naming

- Say what it is in business words: `deliveryRate`, `codAmountDzd`, `wilayaCode`. No `data`, `info`, `tmp`, `obj`, `handle`.
- Booleans read as questions: `isConfirmed`, `hasStopDesk`, `canCancel`.
- Money is integer centimes or dinars with the unit in the name (`priceDzd`). Never floats for money.
- Units in names: `timeoutMs`, `weightGrams`.

## Errors

- Domain errors are classes (`OrderAlreadyShippedError extends DomainError`) with a stable `code`. Map them to HTTP in one exception filter, not in every controller.
- Never swallow errors. `catch` only to add context, translate, or retry. Log once, at the boundary.
- No `throw new Error('something')` for expected business cases; use a domain error or a `Result` type.

## TypeScript

- `strict: true`. No `any` (use `unknown` and narrow), no `@ts-ignore`, no `as` casts to silence errors.
- Types come from zod schemas in `packages/contracts` (`z.infer<typeof X>`); do not hand-write duplicates.
- Prefer `readonly` properties and pure functions. Mutate only inside a clearly named method.
- Exhaustive `switch` over unions with a `never` check.

## Comments

Explain **why**, never **what**. If you need a comment to explain what code does, rename or extract instead. Every `TODO` names an issue: `// TODO(#42): ...`.

## Review checklist

- [ ] Each file and function does one thing and fits the limits
- [ ] No framework or Prisma import in `domain/`
- [ ] New behaviour added by a new class, not a new `if` branch in an old one
- [ ] No duplicated types; contracts imported from `packages/contracts`
- [ ] Names in business language, units in names, money never a float
