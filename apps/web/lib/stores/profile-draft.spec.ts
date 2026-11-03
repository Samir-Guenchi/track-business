import type { StoreProfile } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import { draftOf, profileChange, toggleCarrier } from './profile-draft';

const saved: StoreProfile = {
  originWilayaCode: 16,
  originCommuneId: 1601,
  contactPhone: '+213550123456',
  logoUrl: null,
  dailyVolume: null,
  carriers: ['yalidine'],
  defaultLanguage: 'fr',
  updatedAt: '2026-11-03T00:00:00.000Z',
};

describe('profile draft', () => {
  it('sends nothing when nothing changed', () => {
    expect(profileChange(draftOf(saved), saved)).toBeNull();
  });

  it('sends only the changed fields, an emptied phone as null', () => {
    const draft = { ...draftOf(saved), contactPhone: ' ', dailyVolume: '10_50' as const };
    expect(profileChange(draft, saved)).toEqual({ contactPhone: null, dailyVolume: '10_50' });
  });

  it('sends the commune with a new wilaya', () => {
    const draft = { ...draftOf(saved), originWilayaCode: 31, originCommuneId: 3101 };
    expect(profileChange(draft, saved)).toEqual({ originWilayaCode: 31, originCommuneId: 3101 });
  });

  it('toggles a carrier on and off', () => {
    expect(toggleCarrier(['yalidine'], 'noest')).toEqual(['yalidine', 'noest']);
    expect(toggleCarrier(['yalidine', 'noest'], 'yalidine')).toEqual(['noest']);
  });
});
