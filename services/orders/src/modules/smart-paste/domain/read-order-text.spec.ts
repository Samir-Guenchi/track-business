import type { LocatePlacesResponse } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import { readOrderText } from './read-order-text.js';

const commune = {
  id: 1621,
  wilayaCode: 16,
  nameFr: 'Bab Ezzouar',
  nameAr: 'باب الزوار',
  postalCode: null,
  hasStopDesk: true,
};

const babEzzouar = (communeText: string, wilayaText: string | null): LocatePlacesResponse => ({
  wilaya: { code: 16, matchedText: wilayaText, score: 1 },
  commune: { commune, matchedText: communeText, score: 1 },
});

describe('readOrderText', () => {
  it('reads a one-line French DM', () => {
    const text = 'Mohamed Amine 0555 12 34 56 Bab Ezzouar Alger taille L noir x2';

    expect(readOrderText(text, babEzzouar('Bab Ezzouar', 'Alger'))).toEqual({
      name: 'Mohamed Amine',
      phone: '+213555123456',
      phone2: null,
      wilayaCode: 16,
      communeId: 1621,
      placeScore: 1,
      address: null,
      quantity: 2,
      rest: 'taille L noir',
    });
  });

  it('reads a labelled message in Arabic with Arabic-Indic digits', () => {
    const text = 'الاسم: سمير بن علي\nالهاتف: ٠٦٦١٢٢٣٣٤٤\nالعنوان: حي 200 مسكن باب الزوار\n3 حبات';
    const result = readOrderText(text, babEzzouar('باب الزوار', null));

    expect(result).toMatchObject({
      name: 'سمير بن علي',
      phone: '+213661223344',
      address: 'حي 200 مسكن',
      quantity: 3,
      rest: null,
    });
  });

  it('keeps two phones and normalises international spellings', () => {
    const result = readOrderText('Karim +213 7 70 11 22 33 / 00213555000111', null);

    expect(result).toMatchObject({ phone: '+213770112233', phone2: '+213555000111' });
  });

  it('does not take a greeting for a name and keeps unknown text in rest', () => {
    const result = readOrderText('Salam je veux la robe rouge 0550 00 00 01', null);

    expect(result).toMatchObject({ name: null, rest: 'Salam je veux la robe rouge' });
  });

  it('ignores numbers that are not mobiles or quantities', () => {
    const result = readOrderText('Prix 3500 DA, cité 200 logts, 021 23 45 67', null);

    expect(result).toMatchObject({ phone: null, quantity: null, wilayaCode: null });
  });

  it('works without the place locator', () => {
    expect(readOrderText('Yacine 0699887766', null)).toMatchObject({
      name: 'Yacine',
      phone: '+213699887766',
      communeId: null,
      placeScore: null,
    });
  });
});
