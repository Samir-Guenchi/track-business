# identity service

Owns users, sessions, stores (tenants), memberships and roles (ADR-0001). Built on `@trackecom/service-kit`.

```bash
cp .env.example .env          # then point DATABASE_URL at your local identity database
pnpm --filter @trackecom/identity db:migrate   # apply / create migrations
pnpm --filter @trackecom/identity dev          # http://localhost:4001/health/ready
```

- `GET /health/live`, `GET /health/ready` (database + Redis), `GET /docs/openapi.json`
- Prisma schema: one file per module in `prisma/schema/`; the client is generated into `src/generated/` (git-ignored) by `pnpm generate`, which Turborepo runs before build, lint, typecheck and test.
- Integration tests (`*.int.spec.ts`) run when `TEST_DATABASE_URL` and `TEST_REDIS_URL` are set (CI sets both).
