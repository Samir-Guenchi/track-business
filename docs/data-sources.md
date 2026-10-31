# Reference data sources

Reference data lives in the `shipping` service (`services/shipping/prisma/schema/geo.prisma`). Every row records the `datasetVersion` that introduced it.

## Wilayas

69 wilayas, French and Arabic names, in two dataset versions. Older rows are never edited.

| Version | Codes | Source | Stored in |
|---|---|---|---|
| `2019-12` | 1 to 58 | Law 84-09 (48 wilayas) as amended by law 19-12 of 11 December 2019 | `services/shipping/src/modules/geo/infrastructure/seed/wilayas.data.ts` |
| `2026-04` | 59 to 69 | Law 26-06, Journal Officiel n° 25 of 5 April 2026 (former delegated wilayas) | `.../seed/wilayas-2026.data.ts` |

Reviewed 2026-10-31. The 2026 numbering (59 Aflou, 60 Barika, 61 El Kantara, 62 Bir El Ater, 63 El Aricha, 64 Ksar Chellala, 65 Aïn Ouessara, 66 Messaad, 67 Ksar El Boukhari, 68 Bou Saâda, 69 El Abiodh Sidi Cheikh) follows the parent wilaya order and matches the GeoAlgeria dataset; press articles disagree on a few numbers, so **check it once against the Journal Officiel text** before carriers start using the new codes. New vehicle plates use these codes from 1 January 2027.

## Communes

| Field | Value |
|---|---|
| Version | `2026-04` |
| Content | 1,541 communes, ONS commune code as `id`, French and Arabic names, postal code, extra spellings |
| File | `services/shipping/data/geo/communes.csv`, header `id,wilaya_code,name_fr,name_ar,postal_code,aliases`; `aliases` is `|`-separated (Darija and old French spellings) |
| Source | GeoAlgeria 2.4.1 (github.com/yasserstudio/geoalgeria): names, postal codes and codes are MIT (`data/geo/LICENSE.geoalgeria`). We do not take its OpenStreetMap coordinates or boundaries (ODbL) or its Algérie Poste mirror. |

The 2026 reform did not renumber communes: Aflou is still commune 319, now in wilaya 59. Algérie Poste also kept the old postal codes (Aflou is 03001). So an order stored with a commune id stays valid; its wilaya is read from the commune. No `GeoCodeChange` rows were needed.

`db:seed` loads the shipped file by default (override with `GEO_COMMUNES_CSV` and `GEO_COMMUNES_VERSION`). Import (idempotent, validates the whole file before writing):

```bash
pnpm --filter @trackecom/shipping build
DATABASE_URL=... pnpm --filter @trackecom/shipping db:seed
```

Tested on 2026-10-31 with the shipped file (seeded twice, 69 wilayas and 1,541 communes each time). Search: `bab zouar`, `bordj kifan`, `dar beida`, `mestghanem`, `bousmail`, `khroub` and the Arabic `باب الزوار` all return the right commune first.

## Applying an administrative reform

1. Add the new rows with a new `datasetVersion` (e.g. `2026-reform`).
2. Set `retiredIn` on rows that no longer exist (they disappear from the API but old orders keep their code).
3. Insert one `GeoCodeChange` row per moved code (`entity` = `wilaya` or `commune`, `oldCode` -> `newCode`). Orders and prices are remapped from this table by their owning service.
4. Record the decree and date in this file.

## Stop desks and carrier codes

`StopDesk` and `CarrierGeoMapping` are filled by each carrier adapter (#30, #40) from the carrier's own API, never by hand.
