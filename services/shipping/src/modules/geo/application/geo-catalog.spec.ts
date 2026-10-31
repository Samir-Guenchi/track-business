import type { Wilaya } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import type { SearchableCommune } from '../domain/commune-search-index.js';
import { GEO_CACHE_TTL_MS, GeoCatalog, WilayaNotFoundError } from './geo-catalog.js';
import type { GeoReferenceReader } from './ports/geo-reference.reader.js';

class FakeReader implements GeoReferenceReader {
  loads = 0;
  wilayas: Wilaya[] = [{ code: 16, nameAr: 'الجزائر', nameFr: 'Alger' }];
  communes: SearchableCommune[] = [
    {
      id: 1601,
      wilayaCode: 16,
      nameAr: 'باب الزوار',
      nameFr: 'Bab Ezzouar',
      postalCode: '16111',
      hasStopDesk: true,
      aliases: [],
    },
  ];

  async listWilayas(): Promise<Wilaya[]> {
    this.loads += 1;
    return this.wilayas;
  }

  async listCommunes(): Promise<SearchableCommune[]> {
    return this.communes;
  }
}

function setup(): { reader: FakeReader; catalog: GeoCatalog; clock: { now: number } } {
  const reader = new FakeReader();
  const clock = { now: 0 };
  return { reader, clock, catalog: new GeoCatalog(reader, () => clock.now) };
}

describe('GeoCatalog', () => {
  it('lists the communes of a wilaya without search aliases', async () => {
    const { catalog } = setup();

    const communes = await catalog.listCommunes(16);

    expect(communes).toEqual([expect.not.objectContaining({ aliases: expect.anything() })]);
  });

  it('rejects an unknown wilaya', async () => {
    const { catalog } = setup();

    await expect(catalog.listCommunes(99)).rejects.toBeInstanceOf(WilayaNotFoundError);
  });

  it('reads the database once per TTL', async () => {
    const { catalog, reader, clock } = setup();

    await catalog.listWilayas();
    await catalog.search('bab', { limit: 3 });
    clock.now = GEO_CACHE_TTL_MS + 1;
    await catalog.listWilayas();

    expect(reader.loads).toBe(2);
  });
});
