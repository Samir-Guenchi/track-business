import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// SWC emits decorator metadata, which Nest dependency injection needs.
// Files run one at a time: the integration suites share one Postgres server in CI.
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    include: ['src/**/*.spec.ts'],
    fileParallelism: false,
    // Integration specs migrate their own Postgres schema. Prisma's migrate lock is per
    // database, so parallel services would queue on it; the schemas never overlap.
    env: { PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: '1' },
    hookTimeout: 30_000,
  },
});
