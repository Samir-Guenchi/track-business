# @trackecom/connectors

The `StoreConnector` port that every shop platform implements (ADR-0003, #47, #48), its shared types, `ConnectorError` and a registry.

- A connector is stateless. The shop URL and decrypted secrets come in a `ConnectorContext` on every call.
- It returns orders as `ExternalOrder`, whatever the platform. Matching the address to our wilaya and commune codes happens in the integrations service, not here.
- It throws `ConnectorError` (`auth` means the seller must reconnect; only `rate_limited` and `unavailable` are retried).
- `@trackecom/connectors/testing` exports `FakeConnector`, an in-memory shop for tests.

Adding a platform is one class in `src/<platform>/` plus one line where the registry is built.
