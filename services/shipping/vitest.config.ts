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
    // Several specs run `prisma migrate deploy` on a fresh CI database; running them at the same
    // time made one of them fail now and then, so integration files run one at a time.
    fileParallelism: false,
    hookTimeout: 30_000,
  },
});
