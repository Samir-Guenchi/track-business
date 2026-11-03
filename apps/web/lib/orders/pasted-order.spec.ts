import type { ParseOrderTextResponse } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import { emptyDraft } from './order-draft';
import { filledFields, localPhone, withPastedOrder } from './pasted-order';

const parsed: ParseOrderTextResponse = {
  name: 'Karim',
  phone: '+213555123456',
  phone2: null,
  wilayaCode: 16,
  communeId: 1621,
  placeScore: 1,
  address: null,
  quantity: 2,
  rest: 'robe noire taille L',
};

describe('pasted order', () => {
  it('writes the phone the way agents read it', () => {
    expect(localPhone('+213555123456')).toBe('0555 12 34 56');
  });

  it('fills an empty form and keeps the rest in the notes', () => {
    const draft = withPastedOrder(emptyDraft(), parsed);

    expect(draft).toMatchObject({
      phone: '0555 12 34 56',
      name: 'Karim',
      wilayaCode: 16,
      communeId: 1621,
      notes: 'robe noire taille L',
    });
    expect(draft.items[0]?.quantity).toBe(2);
  });

  it('never overwrites what the agent already typed', () => {
    const typed = { ...emptyDraft(), name: 'Amina', wilayaCode: 31, communeId: 3105, notes: 'VIP' };
    const draft = withPastedOrder(typed, parsed);

    expect(draft).toMatchObject({ name: 'Amina', wilayaCode: 31, communeId: 3105 });
    expect(draft.notes).toBe('VIP\nrobe noire taille L');
  });

  it('lists the fields it filled', () => {
    expect(filledFields(parsed)).toEqual(['phone', 'name', 'commune', 'quantity']);
  });
});
