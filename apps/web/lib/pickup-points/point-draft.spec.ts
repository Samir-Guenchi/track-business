import { describe, expect, it } from 'vitest';
import { currentMonth, emptyDraft, toPointInput } from './point-draft';

describe('toPointInput', () => {
  it('turns the typed strings into a request body', () => {
    const draft = {
      ...emptyDraft,
      name: 'Superette test',
      wilayaCode: '47',
      communeId: '4701',
      address: 'Rue test',
      phone: '0555 00 00 01',
    };
    expect(toPointInput(draft)).toEqual({
      input: expect.objectContaining({ wilayaCode: 47, capacity: 20, phone: '+213555000001' }),
    });
  });

  it('names the fields to fix', () => {
    expect(toPointInput(emptyDraft)).toEqual({
      invalid: ['name', 'wilayaCode', 'communeId', 'address', 'phone'],
    });
  });
});

describe('currentMonth', () => {
  it('uses Algiers time at the turn of the month', () => {
    expect(currentMonth(new Date('2026-11-30T23:30:00Z'))).toBe('2026-12');
  });
});
