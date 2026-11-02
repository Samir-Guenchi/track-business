import { describe, expect, it } from 'vitest';
import { ListStopDesksQuerySchema } from './stop-desk.schema.js';

describe('ListStopDesksQuerySchema', () => {
  it('takes a wilaya, a commune or a point, from query strings', () => {
    expect(ListStopDesksQuerySchema.parse({ wilayaCode: '16' })).toMatchObject({
      wilayaCode: 16,
      limit: 30,
    });
    expect(ListStopDesksQuerySchema.parse({ lat: '36.75', lng: '3.05' })).toMatchObject({
      lat: 36.75,
      lng: 3.05,
    });
  });

  it('refuses an empty query and half a point', () => {
    expect(ListStopDesksQuerySchema.safeParse({}).success).toBe(false);
    expect(ListStopDesksQuerySchema.safeParse({ wilayaCode: '16', lat: '36.7' }).success).toBe(
      false,
    );
  });
});
