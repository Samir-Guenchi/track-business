import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseCommunesCsv } from './parse-communes-csv.js';
import { CURRENT_WILAYAS } from './seed-geo.js';

const communes = parseCommunesCsv(
  readFileSync(new URL('../../../../../data/geo/communes.csv', import.meta.url), 'utf8'),
);

describe('shipped geo reference data', () => {
  it('has the 69 wilayas, numbered 1 to 69 without gaps', () => {
    expect(CURRENT_WILAYAS.map((wilaya) => wilaya.code)).toEqual(
      Array.from({ length: 69 }, (_, i) => i + 1),
    );
  });

  it('has 1,541 communes with unique codes, each in a known wilaya', () => {
    const wilayaCodes = new Set(CURRENT_WILAYAS.map((wilaya) => wilaya.code));

    expect(communes).toHaveLength(1541);
    expect(new Set(communes.map((commune) => commune.id)).size).toBe(1541);
    expect(communes.every((commune) => wilayaCodes.has(commune.wilayaCode))).toBe(true);
  });

  it('gives every wilaya at least one commune', () => {
    const used = new Set(communes.map((commune) => commune.wilayaCode));

    expect(CURRENT_WILAYAS.filter((wilaya) => !used.has(wilaya.code))).toEqual([]);
  });

  it('keeps commune codes through the 2026 reform: Aflou stays 319, now in wilaya 59', () => {
    expect(communes.find((commune) => commune.id === 319)).toMatchObject({
      nameFr: 'Aflou',
      wilayaCode: 59,
    });
  });
});
