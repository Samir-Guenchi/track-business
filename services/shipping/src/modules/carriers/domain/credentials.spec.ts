import { describe, expect, it } from 'vitest';
import { credentialHint, pickCredentials } from './credentials.js';

const fields = [
  { key: 'apiId', label: 'API ID', secret: false },
  { key: 'apiToken', label: 'API token', secret: true },
];

describe('carrier credentials', () => {
  it('keeps declared fields only and reports missing ones', () => {
    const result = pickCredentials(fields, { apiId: 'abc', extra: 'x' });

    expect(result).toEqual({ credentials: { apiId: 'abc' }, missing: ['apiToken'] });
  });

  it('shows only the last four characters of a long first field', () => {
    expect(credentialHint(fields, { apiId: '1234567890ab' })).toBe('••••90ab');
    expect(credentialHint(fields, { apiId: 'short' })).toBe('••••');
  });
});
