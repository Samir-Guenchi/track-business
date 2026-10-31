import type { PrismaClient } from '../../../../generated/prisma/client.js';
import type { CommuneRow } from './parse-communes-csv.js';
import { WILAYAS_2026, WILAYAS_2026_VERSION } from './wilayas-2026.data.js';
import { WILAYAS_2019, WILAYAS_2019_VERSION, type WilayaRow } from './wilayas.data.js';

export interface GeoSeedResult {
  readonly wilayas: number;
  readonly communes: number;
}

const WILAYA_VERSIONS: readonly (readonly [version: string, rows: readonly WilayaRow[]])[] = [
  [WILAYAS_2019_VERSION, WILAYAS_2019],
  [WILAYAS_2026_VERSION, WILAYAS_2026],
];

/** Every wilaya in force today (69), with the dataset version that introduced it. */
export const CURRENT_WILAYAS = WILAYA_VERSIONS.flatMap(([datasetVersion, rows]) =>
  rows.map(([code, nameFr, nameAr]) => ({ code, nameFr, nameAr, datasetVersion })),
);

/** Idempotent: safe to run on every deploy. Rows are upserted by their official code. */
export async function seedGeo(
  prisma: PrismaClient,
  communes: readonly CommuneRow[],
  communesVersion: string,
): Promise<GeoSeedResult> {
  await prisma.$transaction([
    ...CURRENT_WILAYAS.map(({ code, nameFr, nameAr, datasetVersion }) =>
      prisma.wilaya.upsert({
        where: { code },
        create: { code, nameFr, nameAr, datasetVersion },
        update: { nameFr, nameAr },
      }),
    ),
    // A reform moves a commune to another wilaya without changing its code, so wilayaCode updates.
    ...communes.map(({ id, ...fields }) =>
      prisma.commune.upsert({
        where: { id },
        create: { id, ...fields, datasetVersion: communesVersion },
        update: fields,
      }),
    ),
  ]);
  return { wilayas: CURRENT_WILAYAS.length, communes: communes.length };
}
