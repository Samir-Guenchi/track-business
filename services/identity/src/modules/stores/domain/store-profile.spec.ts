import { describe, expect, it } from 'vitest';
import { applyProfileChange, changedFields, EMPTY_PROFILE } from './store-profile.js';

const oran = { ...EMPTY_PROFILE, originWilayaCode: 31, originCommuneId: 3101 };

describe('store profile', () => {
  it('applies only the fields sent', () => {
    const after = applyProfileChange(oran, { dailyVolume: '10_50' });
    expect(after).toMatchObject({
      originWilayaCode: 31,
      originCommuneId: 3101,
      dailyVolume: '10_50',
    });
    expect(after).not.toHaveProperty('updatedAt');
    expect(after).not.toHaveProperty('logoUrl');
  });

  it('drops the old commune when the wilaya moves without one', () => {
    expect(applyProfileChange(oran, { originWilayaCode: 16 })).toMatchObject({
      originWilayaCode: 16,
      originCommuneId: null,
    });
    expect(applyProfileChange(oran, { originWilayaCode: 16, originCommuneId: 1601 })).toMatchObject(
      {
        originCommuneId: 1601,
      },
    );
    expect(applyProfileChange(oran, { originWilayaCode: 31 }).originCommuneId).toBe(3101);
  });

  it('keeps only what changed for the audit log', () => {
    const before = { a: 1, list: ['x'], same: 'y' };
    expect(changedFields(before, { a: 2, list: ['x', 'z'], same: 'y' })).toEqual({
      before: { a: 1, list: ['x'] },
      after: { a: 2, list: ['x', 'z'] },
    });
  });
});
