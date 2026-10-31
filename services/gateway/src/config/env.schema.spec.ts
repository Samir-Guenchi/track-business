import { describe, expect, it } from 'vitest';
import { loadEnv } from './env.schema.js';

describe('loadEnv', () => {
  it('applies defaults for local development', () => {
    const env = loadEnv({});

    expect(env).toMatchObject({ NODE_ENV: 'development', PORT: 4000 });
  });

  it('splits the CORS allowlist', () => {
    const env = loadEnv({ CORS_ORIGINS: 'https://a.dz, https://b.dz' });

    expect(env.CORS_ORIGINS).toEqual(['https://a.dz', 'https://b.dz']);
  });

  it('fails fast on an invalid port', () => {
    expect(() => loadEnv({ PORT: 'abc' })).toThrow(/Invalid environment/);
  });
});
