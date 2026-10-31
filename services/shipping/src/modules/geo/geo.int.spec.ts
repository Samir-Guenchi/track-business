import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaPg } from '@prisma/adapter-pg';
import { GeoSearchResponseSchema, ListWilayasResponseSchema } from '@trackecom/contracts';
import { postgresAdapterOptions } from '@trackecom/service-kit';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '../../generated/prisma/client.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { parseCommunesCsv } from './infrastructure/seed/parse-communes-csv.js';
import { seedGeo } from './infrastructure/seed/seed-geo.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];

const FIXTURE = `id,wilaya_code,name_fr,name_ar,postal_code,aliases
1601,16,Bab Ezzouar,باب الزوار,16111,
1602,16,Bordj El Kiffan,برج الكيفان,16120,Fort de l'Eau
3101,31,Es Senia,السانية,,`;

// Own Postgres schema so it never collides with other services' tables on the shared CI server.
describe.skipIf(!baseUrl || !redisUrl)('geo endpoints (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=shipping_geo_test`;
  let app: NestFastifyApplication;

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    const adapter = new PrismaPg(
      { connectionString: databaseUrl },
      postgresAdapterOptions(databaseUrl),
    );
    const prisma = new PrismaClient({ adapter });
    await seedGeo(prisma, parseCommunesCsv(FIXTURE), 'test');
    await prisma.$disconnect();
    app = await startTestApp(testEnv({ DATABASE_URL: databaseUrl, REDIS_URL: redisUrl }));
  });

  afterAll(async () => {
    await app?.close();
  });

  it('lists all 58 wilayas with Arabic and French names', async () => {
    const response = await app.inject({ method: 'GET', url: '/geo/wilayas' });

    const { items } = ListWilayasResponseSchema.parse(response.json());
    expect(items).toHaveLength(58);
    expect(items[15]).toEqual({ code: 16, nameFr: 'Alger', nameAr: 'الجزائر' });
  });

  it('lists the communes of a wilaya', async () => {
    const response = await app.inject({ method: 'GET', url: '/geo/wilayas/16/communes' });

    expect(response.json().items.map((c: { nameFr: string }) => c.nameFr)).toEqual([
      'Bab Ezzouar',
      'Bordj El Kiffan',
    ]);
  });

  it('finds a commune from a Darija spelling', async () => {
    const response = await app.inject({ method: 'GET', url: '/geo/search?q=bab%20zouar' });

    expect(GeoSearchResponseSchema.parse(response.json()).items[0]?.commune.id).toBe(1601);
  });

  it('returns 404 with a stable code for an unknown wilaya', async () => {
    const response = await app.inject({ method: 'GET', url: '/geo/wilayas/77/communes' });

    expect(response.json()).toMatchObject({ error: { code: 'geo.wilaya_not_found' } });
  });
});
