import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseCommunesCsv } from '../infrastructure/seed/parse-communes-csv.js';
import { CURRENT_WILAYAS } from '../infrastructure/seed/seed-geo.js';
import { CommuneSearchIndex } from './commune-search-index.js';
import { locatePlaces } from './place-locator.js';
import { WilayaNameIndex } from './wilaya-name-index.js';

const communes = parseCommunesCsv(
  readFileSync(new URL('../../../../data/geo/communes.csv', import.meta.url), 'utf8'),
).map((row) => ({ ...row, hasStopDesk: false }));

const indexes = {
  wilayas: new WilayaNameIndex(CURRENT_WILAYAS),
  communes: new CommuneSearchIndex(communes),
};

const found = (text: string) => {
  const { wilaya, commune } = locatePlaces(text, indexes);
  return { wilaya: wilaya?.code ?? null, commune: commune?.commune.id ?? null };
};

describe('locatePlaces on the shipped reference data', () => {
  it.each([
    ['Mohamed Amine 0555 12 34 56 Bab Ezzouar Alger taille L noir', 16, 1621],
    ['سمير 0661223344 ولاية 31 السانية', 31, 3105],
    ['es senia oran 2 pieces', 31, 3105],
    ['livraison Bab El Oued svp', 16, 1605],
    ['adresse: cité 200 logts, bab zwar', 16, 1621],
    ['Alger Centre rue Didouche', 16, 1601],
  ])('reads "%s" as wilaya %i, commune %i', (text, wilaya, commune) => {
    expect(found(text)).toEqual({ wilaya, commune });
  });

  it('keeps the wilaya when no commune is named', () => {
    expect(found('Karim, wilaya 19, 0770 11 22 33')).toEqual({ wilaya: 19, commune: null });
  });

  it('returns the words that named each place so callers can cut them out', () => {
    const result = locatePlaces('Bab Ezzouar Alger', indexes);

    expect(result.commune?.matchedText).toBe('Bab Ezzouar');
    expect(result.wilaya?.matchedText).toBe('Alger');
  });

  it('finds nothing in a message without a place', () => {
    expect(found('taille XL couleur noire merci')).toEqual({ wilaya: null, commune: null });
  });

  it('reads a long message quickly', () => {
    const long = `${'bonjour je veux commander la robe rouge taille M '.repeat(18)} Bir El Djir`;
    const started = performance.now();

    expect(found(long.slice(-1000))).toEqual({ wilaya: 31, commune: 3103 });
    expect(performance.now() - started).toBeLessThan(500);
  });
});
