# identity service

Owns users, sessions, stores (tenants), memberships and roles (ADR-0001). Built on `@trackecom/service-kit`.

```bash
cp .env.example .env          # then point DATABASE_URL at your local identity database
pnpm --filter @trackecom/identity db:migrate   # apply / create migrations
pnpm --filter @trackecom/identity dev          # http://localhost:4001/health/ready
```

- `GET /health/live`, `GET /health/ready` (database + Redis), `GET /docs/openapi.json`

## Authentication (#15)

| Endpoint | Notes |
|---|---|
| `POST /auth/register` | email, password (10+ chars, not common, not your name/email), name, optional Algerian mobile, locale; sends a verification email; starts a session |
| `POST /auth/login` | same error for unknown email, wrong password and locked account; 5 failures lock the account 15 min; 10 requests/min per IP |
| `POST /auth/refresh` | rotates the refresh token; reusing an old one revokes the whole family (theft detection) |
| `POST /auth/logout` | revokes the refresh family, clears cookies; idempotent |
| `POST /auth/verify-email`, `POST /auth/forgot-password`, `POST /auth/reset-password` | single-use links (48 h / 30 min); forgot always answers 202; a reset signs out every device |
| `GET /auth/me` | `Authorization: Bearer` or the `te_access` cookie |
| `GET /.well-known/jwks.json` | public ES256 key; other services verify access tokens locally |

Sessions: 15-minute ES256 access JWT + 30-day rotating refresh token (stored as SHA-256). Web gets both as `httpOnly`, `SameSite=Lax` cookies (refresh cookie scoped to `/auth`); mobile sends `x-client-type: mobile` and also receives the refresh token in the body. Passwords use argon2id (19 MiB, t=2).

Not built yet, by design: phone + SMS OTP login and TOTP 2FA (the `User` model and ports leave room for both; they need the notifications service, #46), and a Redis store for the rate limiter (in-memory per replica today).
- Prisma schema: one file per module in `prisma/schema/`; the client is generated into `src/generated/` (git-ignored) by `pnpm generate`, which Turborepo runs before build, lint, typecheck and test.
- Integration tests (`*.int.spec.ts`) run when `TEST_DATABASE_URL` and `TEST_REDIS_URL` are set (CI sets both).
