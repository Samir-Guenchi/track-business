import { describe, expect, it } from 'vitest';
import { BaseEnvSchema } from './base-env.schema.js';
import { loadEnv } from './load-env.js';

describe('loadEnv', () => {
  it('applies defaults and splits the CORS allowlist', () => {
    const env = loadEnv(BaseEnvSchema, {
      PORT: '4000',
      CORS_ORIGINS: 'https://a.dz, https://b.dz',
    });

    expect(env).toMatchObject({
      NODE_ENV: 'development',
      CORS_ORIGINS: ['https://a.dz', 'https://b.dz'],
    });
  });

  it('fails fast when a required variable is missing', () => {
    expect(() => loadEnv(BaseEnvSchema, {})).toThrow(/Invalid environment/);
  });
});
