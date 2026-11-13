import { describe, expect, it } from 'vitest';
import { testEnv } from '../test/test-app.js';

describe('orders env', () => {
  it('treats variables compose leaves empty as unset', () => {
    const env = testEnv({ INTERNAL_TOKEN: '', SELF_CONFIRM_URL: '' });

    expect(env.INTERNAL_TOKEN).toBeUndefined();
    expect(env.SELF_CONFIRM_URL).toBe('http://localhost:3000/confirm');
  });

  it('refuses a short internal token', () => {
    expect(() => testEnv({ INTERNAL_TOKEN: 'short' })).toThrow(/INTERNAL_TOKEN/);
  });
});
