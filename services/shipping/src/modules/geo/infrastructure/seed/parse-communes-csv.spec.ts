import { describe, expect, it } from 'vitest';
import { parseCommunesCsv, splitCsvLine } from './parse-communes-csv.js';

const HEADER = 'id,wilaya_code,name_fr,name_ar,postal_code,aliases';

describe('parseCommunesCsv', () => {
  it('parses names, postal code and aliases', () => {
    const rows = parseCommunesCsv(
      `${HEADER}\n1603,16,Bordj El Kiffan,برج الكيفان,16120,"Fort de l'Eau|Bordj Kifan"\n`,
    );

    expect(rows).toEqual([
      {
        id: 1603,
        wilayaCode: 16,
        nameFr: 'Bordj El Kiffan',
        nameAr: 'برج الكيفان',
        postalCode: '16120',
        aliases: ["Fort de l'Eau", 'Bordj Kifan'],
      },
    ]);
  });

  it('accepts a missing postal code', () => {
    expect(parseCommunesCsv(`${HEADER}\n3101,31,Es Senia,السانية,,`)[0]?.postalCode).toBeNull();
  });

  it('rejects a row without an Arabic name and names the line', () => {
    expect(() => parseCommunesCsv(`${HEADER}\n3101,31,Es Senia,,,`)).toThrow(/line 2/);
  });

  it('keeps escaped quotes inside a quoted cell', () => {
    expect(splitCsvLine('1,"say ""hi""",x')).toEqual(['1', 'say "hi"', 'x']);
  });
});
