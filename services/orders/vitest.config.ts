import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// SWC emits decorator metadata, which Nest dependency injection needs.
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    include: ['src/**/*.spec.ts'],
    // Integration specs migrate their own Postgres schema. Prisma's migrate lock is per
    // database, so parallel services would queue on it; the schemas never overlap.
    env: { PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: '1' },
    hookTimeout: 30_000,
    // The orders and confirmation API specs share one schema (pg_trgm lives in it), so run files one by one.
    fileParallelism: false,
  },
});
