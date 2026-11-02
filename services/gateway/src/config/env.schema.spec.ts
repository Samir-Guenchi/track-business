import { loadEnv } from '@trackecom/service-kit';
import { describe, expect, it } from 'vitest';
import { testEnv } from '../test/test-env.js';
import { EnvSchema } from './env.schema.js';

describe('gateway EnvSchema', () => {
  it('applies defaults for local development', () => {
    expect(testEnv()).toMatchObject({ PORT: 4000 });
  });

  it('fails fast on an invalid port', () => {
    expect(() => testEnv({ PORT: 'abc' })).toThrow(/Invalid environment/);
  });

  it('requires the URL of every service it forwards to', () => {
    expect(() => loadEnv(EnvSchema, {})).toThrow(/IDENTITY_URL/);
  });
});
