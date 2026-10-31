# shipping service

Owns carriers, shipments, tracking, delivery prices and the geo reference data (ADR-0001). Built on `@trackecom/service-kit`.

```bash
cp .env.example .env
pnpm --filter @trackecom/shipping db:migrate
pnpm --filter @trackecom/shipping build && pnpm --filter @trackecom/shipping db:seed   # 69 wilayas and 1,541 communes (see docs/data-sources.md)
pnpm --filter @trackecom/shipping dev    # http://localhost:4002/geo/search?q=bab%20zouar
```

| Endpoint | |
|---|---|
| `GET /geo/wilayas` | current wilayas, AR + FR |
| `GET /geo/wilayas/:code/communes` | communes of one wilaya, with `hasStopDesk` |
| `GET /geo/search?q=&wilayaCode=&limit=` | fuzzy search in Arabic, French and Darija spellings |
| `GET /health/live`, `/health/ready`, `/docs/openapi.json` | |

Reference data is held in memory per replica (refreshed hourly), so lookups never hit the database.
