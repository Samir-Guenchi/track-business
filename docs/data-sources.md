# Reference data sources

Reference data lives in the `shipping` service (`services/shipping/prisma/schema/geo.prisma`). Every row records the `datasetVersion` that introduced it.

## Wilayas

| Field | Value |
|---|---|
| Version | `2019-12` |
| Content | 58 wilayas, codes 1 to 58, French and Arabic names |
| Source | Law 84-09 (48 wilayas) as amended by law 19-12 of 11 December 2019 (wilayas 49 to 58), Journal Officiel |
| Stored in | `services/shipping/src/modules/geo/infrastructure/seed/wilayas.data.ts` |
| Reviewed | 2026-10-31 |

**To check before production:** whether a reform after 2019 created new wilayas. If so, add them as a new dataset version (see below) with the Journal Officiel reference here. Do not edit the 2019 rows.

## Communes

| Field | Value |
|---|---|
| Content | 1,541 communes with French and Arabic names, optional postal code and extra spellings |
| Format | CSV, header `id,wilaya_code,name_fr,name_ar,postal_code,aliases`; `aliases` is `|`-separated (Darija and old French spellings, e.g. `Fort de l'Eau|Bordj Kifan`) |
| Official source | ONS (Office National des Statistiques) commune list and the Journal Officiel decrees |
| Status | **Not committed yet.** The complete open dataset found so far (github.com/othmanus/algeria-cities) has no licence, so we cannot redistribute it. Either obtain the ONS list or get written permission, then commit the CSV with its version here. |

Import (idempotent, validates the whole file before writing):

```bash
pnpm --filter @trackecom/shipping build
DATABASE_URL=... GEO_COMMUNES_CSV=./communes.csv GEO_COMMUNES_VERSION=2026-11 \
  pnpm --filter @trackecom/shipping db:seed
```

Tested on 2026-10-31 with a 1,541-row file: `bab zouar`, `bordj kifan`, `dar beida`, `mestghanem`, `bousmail`, `khroub` and the Arabic `باب الزوار` all return the right commune first.

## Applying an administrative reform

1. Add the new rows with a new `datasetVersion` (e.g. `2026-reform`).
2. Set `retiredIn` on rows that no longer exist (they disappear from the API but old orders keep their code).
3. Insert one `GeoCodeChange` row per moved code (`entity` = `wilaya` or `commune`, `oldCode` -> `newCode`). Orders and prices are remapped from this table by their owning service.
4. Record the decree and date in this file.

## Stop desks and carrier codes

`StopDesk` and `CarrierGeoMapping` are filled by each carrier adapter (#30, #40) from the carrier's own API, never by hand.
