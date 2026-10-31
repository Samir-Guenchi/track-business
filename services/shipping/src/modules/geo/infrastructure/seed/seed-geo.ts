import type { PrismaClient } from '../../../../generated/prisma/client.js';
import type { CommuneRow } from './parse-communes-csv.js';
import { WILAYAS, WILAYAS_DATASET_VERSION } from './wilayas.data.js';

export interface GeoSeedResult {
  readonly wilayas: number;
  readonly communes: number;
}

/** Idempotent: safe to run on every deploy. Rows are upserted by their official code. */
export async function seedGeo(
  prisma: PrismaClient,
  communes: readonly CommuneRow[],
  communesVersion: string,
): Promise<GeoSeedResult> {
  await prisma.$transaction([
    ...WILAYAS.map(([code, nameFr, nameAr]) =>
      prisma.wilaya.upsert({
        where: { code },
        create: { code, nameFr, nameAr, datasetVersion: WILAYAS_DATASET_VERSION },
        update: { nameFr, nameAr },
      }),
    ),
    ...communes.map(({ id, ...fields }) =>
      prisma.commune.upsert({
        where: { id },
        create: { id, ...fields, datasetVersion: communesVersion },
        update: fields,
      }),
    ),
  ]);
  return { wilayas: WILAYAS.length, communes: communes.length };
}
