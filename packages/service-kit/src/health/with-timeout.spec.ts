import { describe, expect, it } from 'vitest';
import { probe } from './with-timeout.js';

describe('probe', () => {
  it('is true when the check resolves', async () => {
    expect(await probe(async () => 'pong')).toBe(true);
  });

  it('is false when the check rejects', async () => {
    expect(await probe(() => Promise.reject(new Error('down')))).toBe(false);
  });

  it('is false when the check hangs past the timeout', async () => {
    expect(await probe(() => new Promise(() => undefined), 10)).toBe(false);
  });
});
