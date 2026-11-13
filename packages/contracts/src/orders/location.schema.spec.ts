import { describe, expect, it } from 'vitest';
import { GeoPointSchema, mapLinkOf } from './location.schema.js';

describe('location pin', () => {
  it('accepts a point in Algeria and refuses a swapped one', () => {
    expect(GeoPointSchema.safeParse({ lat: 36.75, lng: 3.06 }).success).toBe(true);
    expect(GeoPointSchema.safeParse({ lat: 3.06, lng: 36.75 }).success).toBe(false);
  });

  it('builds a maps link with six decimals', () => {
    expect(mapLinkOf({ lat: 36.7525, lng: 3.04197 })).toBe(
      'https://www.google.com/maps?q=36.752500,3.041970',
    );
  });
});
