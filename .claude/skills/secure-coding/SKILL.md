---
name: secure-coding
description: TrackEcom security rules - authn/authz, tenant isolation, input validation, secrets, personal data (Algerian law 18-07), webhooks, uploads, outbound HTTP and dependencies. Use for any code that handles users, input, data, money or external systems.
---

# Secure coding

TrackEcom stores customer names, phone numbers, addresses and money flows for many sellers. One leak between stores ends the product. Default to deny.

## Authentication

- Passwords hashed with **argon2id**. Never log or return them, even hashed.
- `identity` issues short-lived access tokens (15 min, signed JWT, asymmetric key) and rotating refresh tokens (stored hashed, revocable, reuse detection).
- Web uses `httpOnly`, `Secure`, `SameSite=Lax` cookies plus CSRF protection on state-changing routes. Mobile uses bearer tokens.
- Services verify tokens with the public key (JWKS); they never call `identity` per request.
- Login, OTP and password reset are rate limited and return the same message for unknown users.

## Authorization and tenant isolation

- Every route has an explicit guard: role (`owner`, `manager`, `agent`) and store membership. No guard = request denied (global deny-by-default guard).
- `storeId` comes **only** from the verified token/context, never from body, query or path without a membership check.
- Every repository method takes `storeId` and filters by it. Add a test that store A cannot read or change store B's data.
- Check ownership of every ID in a request (IDOR): loading by `id` alone is a bug.
- Service-to-service calls carry a service identity (signed service token or mTLS) and are not reachable from the internet.

## Input and output

- Validate every external input with zod at the boundary (HTTP, events, jobs, webhooks, files). Reject unknown fields.
- Prisma only; no raw SQL string building. If `$queryRaw` is unavoidable, use tagged templates.
- Escape output by default (React does); never `dangerouslySetInnerHTML` with user data.
- CSV/Excel export: prefix cells starting with `= + - @` to prevent formula injection.
- Uploads (CSV import, labels): size limit, MIME + extension check, parse in a job, never execute or serve back as HTML.

## Secrets and configuration

- No secret in code, tests, fixtures, commits, logs or PR text. `.env` is git-ignored; only `.env.example` with placeholders is committed.
- Carrier API keys and store tokens are encrypted at rest (envelope encryption, key from the secret manager) and decrypted only in the adapter.
- Rotate on suspicion. If a secret is committed, treat it as leaked even after the commit is removed.

## Personal data (Algerian law 18-07)

- Collect only what the feature needs. Customer phone numbers are personal data.
- Never log phone numbers, names, addresses or tokens. Log IDs; mask phones as `+213****1234` if you must.
- The shared blacklist (#52) stores **hashed** phone numbers (keyed HMAC), never raw numbers across stores.
- Support export and deletion of a customer's data per store.
- Test data uses obviously fake numbers (`+213 555 00 00 0x`), never real ones.

## External systems

- **Webhooks in** (carriers, Shopify...): verify HMAC signature with constant-time compare, reject old timestamps (replay), process idempotently by event id.
- **Outbound HTTP**: allowlist carrier hosts; for user-supplied URLs (store integrations) block private IP ranges and metadata endpoints (SSRF); always set timeouts.
- Treat carrier responses as untrusted input: validate with zod before using.

## HTTP hardening (gateway)

- Helmet security headers, strict CORS allowlist, request body size limit, rate limits per IP and per store.
- Error responses never include stack traces, SQL or internal hostnames.
- Audit log (#20) for sensitive actions: role changes, exports, COD adjustments, API key creation.

## Dependencies and CI

- Pin versions via the lockfile; review new dependencies (maintenance, size, licence).
- CI runs `pnpm audit` (high and critical fail), secret scanning and CodeQL.
- Containers run as non-root on minimal base images.

## Review checklist

- [ ] Route has a guard; `storeId` from context; IDs checked for ownership
- [ ] All input parsed with zod; unknown fields rejected
- [ ] No PII or secrets in logs, errors, tests or fixtures
- [ ] Webhooks verified, outbound calls time out, user URLs SSRF-checked
- [ ] Cross-tenant test exists for new data access
