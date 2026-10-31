import { loadEnv } from '@trackecom/service-kit';
import { describe, expect, it } from 'vitest';
import { EnvSchema } from './env.schema.js';

const valid = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/identity',
  REDIS_URL: 'redis://localhost:6379',
};

describe('identity EnvSchema', () => {
  it('defaults the port to 4001', () => {
    expect(loadEnv(EnvSchema, valid).PORT).toBe(4001);
  });

  it('fails fast without a database URL', () => {
    expect(() => loadEnv(EnvSchema, { REDIS_URL: valid.REDIS_URL })).toThrow(/DATABASE_URL/);
  });

  it('rejects a non-Postgres database URL', () => {
    expect(() => loadEnv(EnvSchema, { ...valid, DATABASE_URL: 'mysql://u:p@h/db' })).toThrow(
      /Invalid environment/,
    );
  });
});
