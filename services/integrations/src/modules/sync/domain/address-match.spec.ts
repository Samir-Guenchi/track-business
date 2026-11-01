import { describe, expect, it } from 'vitest';
import { matchCommune, matchWilaya, normalize } from './address-match.js';

const WILAYAS = [
  { id: 6, nameFr: 'Béjaïa', nameAr: 'بجاية' },
  { id: 16, nameFr: 'Alger', nameAr: 'الجزائر' },
  { id: 31, nameFr: 'Oran', nameAr: 'وهران' },
];
const COMMUNES = [
  { id: 1601, nameFr: 'Alger Centre', nameAr: 'الجزائر الوسطى' },
  { id: 1621, nameFr: 'Bab Ezzouar', nameAr: 'باب الزوار' },
  { id: 1622, nameFr: 'Bab El Oued', nameAr: 'باب الوادي' },
];

describe('address matching', () => {
  it('ignores case, accents and punctuation', () => {
    expect(normalize('  BÉJAÏA-ville ')).toBe('bejaia ville');
  });

  it.each([
    ['16', 16],
    ['16 - Alger', 16],
    ['DZ-31', 31],
    ['bejaia', 6],
    ['وهران', 31],
    ['Wilaya de Béjaïa', 6],
  ])('reads the wilaya in %s', (text, code) => {
    expect(matchWilaya(text, WILAYAS)).toBe(code);
  });

  it('gives up on unknown wilayas instead of guessing', () => {
    expect(matchWilaya('Paris', WILAYAS)).toBeNull();
    expect(matchWilaya('99', WILAYAS)).toBeNull();
    expect(matchWilaya(null, WILAYAS)).toBeNull();
  });

  it('finds the commune by exact or unique partial name', () => {
    expect(matchCommune('bab ezzouar', COMMUNES)).toBe(1621);
    expect(matchCommune('Cité 5 juillet, Bab Ezzouar', COMMUNES)).toBe(1621);
    expect(matchCommune('الجزائر الوسطى', COMMUNES)).toBe(1601);
  });

  it('refuses an ambiguous commune', () => {
    expect(matchCommune('Bab', COMMUNES)).toBeNull();
  });
});
