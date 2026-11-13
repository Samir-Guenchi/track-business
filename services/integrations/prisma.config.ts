import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// Local runs read services/<name>/.env; CI and containers pass real env vars, which win.
if (existsSync('.env')) process.loadEnvFile('.env');

// DATABASE_URL is only needed for migrate/studio; `prisma generate` works without it.
export default defineConfig({
  schema: 'prisma/schema',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env['DATABASE_URL'] ?? '' },
});
