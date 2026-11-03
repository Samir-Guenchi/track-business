import { describe, expect, it } from 'vitest';
import { EVENT_TYPE_PATTERN } from '../events/envelope.schema.js';
import { STORE_EVENTS, UpdateStoreProfileRequestSchema } from './store-profile.schema.js';

describe('store profile contracts', () => {
  it('takes a partial update and normalises the phone', () => {
    const body = UpdateStoreProfileRequestSchema.parse({
      originWilayaCode: 16,
      contactPhone: '0550 12 34 56',
    });
    expect(body).toEqual({ originWilayaCode: 16, contactPhone: '+213550123456' });
  });

  it('lets a field be cleared with null', () => {
    expect(UpdateStoreProfileRequestSchema.parse({ dailyVolume: null })).toEqual({
      dailyVolume: null,
    });
  });

  it('refuses an empty update, a commune without wilaya, a logo URL and odd carrier codes', () => {
    const fails = (body: object) => !UpdateStoreProfileRequestSchema.safeParse(body).success;
    expect(fails({})).toBe(true);
    expect(fails({ originCommuneId: 1601 })).toBe(true);
    expect(fails({ logoUrl: 'https://example.com/logo.png' })).toBe(true);
    expect(fails({ carriers: ['Yalidine Express'] })).toBe(true);
  });

  it('names its event by the convention', () => {
    expect(STORE_EVENTS.profileUpdated).toMatch(EVENT_TYPE_PATTERN);
  });
});
