import { describe, expect, it } from 'vitest';
import { internalTokenMatches } from './internal-token.guard.js';

describe('internalTokenMatches', () => {
  const secret = 'a-shared-secret-of-enough-length-000';

  it('accepts only the configured secret', () => {
    expect(internalTokenMatches(secret, secret)).toBe(true);
    expect(internalTokenMatches(secret, `${secret}x`)).toBe(false);
    expect(internalTokenMatches(secret, undefined)).toBe(false);
  });

  it('refuses everything when no secret is configured', () => {
    expect(internalTokenMatches(undefined, '')).toBe(false);
    expect(internalTokenMatches('', '')).toBe(false);
  });
});
