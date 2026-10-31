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
| `GET /pricing/store-prices` | store selling price per wilaya x delivery type, plus free shipping rule (`store.read`) |
| `PUT /pricing/store-prices` | bulk edit of those prices (`store.update`) |
| `GET /pricing/quote?wilayaCode=&deliveryType=&subtotal=` | fee the order form shows live (`orders.read`) |
| `GET`/`PUT /pricing/rate-cards/:carrier` | carrier costs; a PUT replaces the whole card (API or Excel import) |
| `GET /health/live`, `/health/ready`, `/docs/openapi.json` | |

Reference data is held in memory per replica (refreshed hourly), so lookups never hit the database. Geo endpoints are public; every `/pricing` call needs a token and `x-store-id`, and reads only that store's rows.
