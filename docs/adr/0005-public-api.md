# ADR-0005: Public API with API keys and outgoing webhooks

- Status: Proposed
- Date: 2026-11-01
- Issue: #57

## Context

Developers (agencies, sellers with their own site, ERPs) want to create orders and hear about status changes without the web app. #57 asks for a versioned public API, API keys per store with scopes, outgoing webhooks with signatures and retries, and developer docs. Today every service trusts one kind of caller: a user's access token (identity JWT) plus `x-store-id`, checked by `StoreAccessGuard` against the user's role in that store.

This touches authentication, so it is decided before any code.

## Decision

1. **API keys live in identity.** A key belongs to one store and carries one **role** from the existing matrix (`manager`, `agent`, `packer`, `accountant`; never `owner`). Scopes are therefore the same permissions services already check, with no second permission system.
   - Shown once at creation as `te_live_<random>`; identity stores only a SHA-256 hash and the last 4 characters.
   - Created, listed, rotated and revoked by members with `store.update`. Each key records its last use.
2. **Keys are exchanged, not sent to every service.** `POST /v1/auth/token` (identity, through the gateway) takes the key and returns a 15-minute access token.
   - The token's `sub` is the key id and it has a claim `kind: "api_key"`.
   - Identity answers `GET /stores` for that subject with the key's single store and role. `StoreAccessGuard` and every service keep working unchanged.
   - Identity's own user routes (`/me`, account, create store, invitations) refuse `kind: "api_key"` tokens.
3. **The gateway serves `/v1`.**
   - It routes the public paths: orders, shipments, tracking and products.
   - It applies per-key and per-plan rate limits in Redis.
   - It returns the documented error shape.
   - Internal routes are never exposed.
4. **Outgoing webhooks are a new small service, `webhooks`.**
   - It consumes the domain events a store subscribed to and maps each one to a public, versioned payload. These are never internal events as-is, and never carry customer contact details unless the subscription allows it.
   - It signs each delivery with HMAC-SHA256: header `TrackEcom-Signature: t=<unix>,v1=<hex>` over `t.body`, with a per-endpoint secret.
   - It retries with backoff for up to 24 hours and keeps a delivery log per endpoint (status, latency, attempts).
   - Endpoint URLs must be HTTPS. They are resolved and checked against private ranges on every delivery, which guards against SSRF.
5. **Docs come from OpenAPI.** Each service already publishes `/docs/openapi.json`; the gateway merges the public paths into one spec for the developer portal. The SDKs and the Postman collection are generated from it.

## Alternatives considered

- **Services accept API keys directly.** Every service would need key lookups or a shared cache of hashes, which widens the secret surface. It was rejected in favour of one exchange in identity.
- **A separate scope system.** It is more flexible, but it duplicates the permission matrix and doubles what has to be reviewed. Roles are enough to start; finer scopes can be added later as new permissions.
- **Webhooks sent by each service.** Every service would need retries, signing and logs. It was rejected for one service that owns delivery.

## Consequences

- One more service (`webhooks`) and database. Identity grows an `api_keys` table and two routes.
- A revoked key stops working within 15 minutes, the life of a token already issued. The gateway can also deny-list revoked key ids at once through Redis.
- Customer personal data could leave TrackEcom through webhooks. The payloads carry only ids and statuses by default, and the launch privacy policy (#49) must mention it.
- Needs from Samir: accept this ADR, the plan limits (requests per minute, webhook endpoints per store), and whether the JS and PHP SDKs are in scope for Phase 4.
