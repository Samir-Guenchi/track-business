import { loadEnv } from '@trackecom/service-kit';
import { describe, expect, it } from 'vitest';
import { EnvSchema } from './env.schema.js';

describe('gateway EnvSchema', () => {
  it('applies defaults for local development', () => {
    expect(loadEnv(EnvSchema, {})).toMatchObject({ NODE_ENV: 'development', PORT: 4000 });
  });

  it('fails fast on an invalid port', () => {
    expect(() => loadEnv(EnvSchema, { PORT: 'abc' })).toThrow(/Invalid environment/);
  });
});
