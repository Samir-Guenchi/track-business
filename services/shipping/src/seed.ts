import { readFile } from 'node:fs/promises';
import { PrismaPg } from '@prisma/adapter-pg';
import { loadEnv, postgresAdapterOptions } from '@trackecom/service-kit';
import { z } from 'zod';
import { PrismaClient } from './generated/prisma/client.js';
import { parseCommunesCsv } from './modules/geo/infrastructure/seed/parse-communes-csv.js';
import { seedGeo } from './modules/geo/infrastructure/seed/seed-geo.js';

const SeedEnvSchema = z.object({
  DATABASE_URL: z.url(),
  /** The communes CSV described in docs/data-sources.md; defaults to the one shipped in data/geo. */
  GEO_COMMUNES_CSV: z
    .string()
    .default(new URL('../data/geo/communes.csv', import.meta.url).pathname),
  GEO_COMMUNES_VERSION: z.string().default('2026-04'),
});

/** `pnpm --filter @trackecom/shipping db:seed` (after build). Prints counts only. */
async function main(): Promise<void> {
  const env = loadEnv(SeedEnvSchema);
  const adapter = new PrismaPg(
    { connectionString: env.DATABASE_URL },
    postgresAdapterOptions(env.DATABASE_URL),
  );
  const prisma = new PrismaClient({ adapter });
  try {
    const communes = parseCommunesCsv(await readFile(env.GEO_COMMUNES_CSV, 'utf8'));
    const result = await seedGeo(prisma, communes, env.GEO_COMMUNES_VERSION);
    process.stdout.write(`Seeded ${result.wilayas} wilayas and ${result.communes} communes\n`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
