import { describe, expect, it } from 'vitest';
import { CommuneSearchIndex, type SearchableCommune } from './commune-search-index.js';

const commune = (
  id: number,
  [nameFr, nameAr]: [string, string],
  aliases: string[] = [],
): SearchableCommune => ({
  id,
  wilayaCode: id < 3200 ? 16 : 31,
  nameFr,
  nameAr,
  postalCode: null,
  hasStopDesk: false,
  aliases,
});

const index = new CommuneSearchIndex([
  commune(1601, ['Bab Ezzouar', 'باب الزوار']),
  commune(1602, ['Bab El Oued', 'باب الوادي']),
  commune(1603, ['Bordj El Kiffan', 'برج الكيفان'], ['Fort de l’Eau']),
  commune(1604, ['Aïn Benian', 'عين البنيان']),
  commune(1605, ['Dar El Beïda', 'الدار البيضاء']),
  commune(3101, ['Es Senia', 'السانية']),
  commune(3102, ['Oran', 'وهران']),
  commune(3103, ['Bir El Djir', 'بئر الجير']),
]);

const topNames = (query: string, wilayaCode?: number): string[] =>
  index
    .search(query, wilayaCode === undefined ? { limit: 3 } : { limit: 3, wilayaCode })
    .map((match) => match.commune.nameFr);

describe('CommuneSearchIndex', () => {
  it.each([
    ['Bab Ezzouar', 'Bab Ezzouar'],
    ['bab zouar', 'Bab Ezzouar'],
    ['Bab Zwar', 'Bab Ezzouar'],
    ['bab el ouad', 'Bab El Oued'],
    ['bordj kifan', 'Bordj El Kiffan'],
    ['borj el kiffane', 'Bordj El Kiffan'],
    ['ain benyan', 'Aïn Benian'],
    ['dar beida', 'Dar El Beïda'],
    ['senia', 'Es Senia'],
    ['bir el djir', 'Bir El Djir'],
    ['fort de l eau', 'Bordj El Kiffan'],
  ])('finds "%s" in the top 3 as %s', (query, expected) => {
    expect(topNames(query)).toContain(expected);
  });

  it.each([
    ['باب الزوار', 'Bab Ezzouar'],
    ['باب زوار', 'Bab Ezzouar'],
    ['الدار البيضاء', 'Dar El Beïda'],
    ['وهران', 'Oran'],
  ])('finds the Arabic spelling "%s" as %s', (query, expected) => {
    expect(topNames(query)[0]).toBe(expected);
  });

  it('ranks the exact name first', () => {
    expect(topNames('Oran')[0]).toBe('Oran');
  });

  it('restricts results to one wilaya when asked', () => {
    expect(topNames('bab', 31)).toEqual([]);
  });

  it('returns nothing for unrelated text', () => {
    expect(topNames('xyzzy qwrt')).toEqual([]);
  });
});
