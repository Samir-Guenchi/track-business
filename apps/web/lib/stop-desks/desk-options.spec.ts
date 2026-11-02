import type { StopDesk } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import { deskSearch, osmEmbedUrl, toDeskOption } from './desk-options';

const desk: StopDesk = {
  id: '00000000-0000-4000-8000-000000000001',
  carrier: 'yalidine',
  name: 'Agence Bab Ezzouar',
  address: 'Cité 5 juillet',
  wilayaCode: 16,
  communeId: 1601,
  communeNameFr: 'Bab Ezzouar',
  communeNameAr: 'باب الزوار',
  lat: 36.7167,
  lng: 3.1833,
  hours: { 'sat-thu': '08:00-17:00' },
  phone: null,
  distanceKm: 1.4,
};

describe('desk options', () => {
  it('words a desk in the reader language with its map link', () => {
    expect(toDeskOption(desk, 'ar')).toMatchObject({
      place: 'باب الزوار · yalidine',
      hours: 'sat-thu 08:00-17:00',
      distance: '1.4 km',
      mapUrl: 'https://www.google.com/maps?q=36.716700,3.183300',
    });
    expect(toDeskOption({ ...desk, lat: null, lng: null }, 'fr').mapUrl).toBeNull();
  });

  it('asks by commune, or by point when the customer shared one', () => {
    expect(deskSearch({ wilayaCode: 16, communeId: 1601 })).toBe(
      'wilayaCode=16&limit=20&communeId=1601',
    );
    expect(deskSearch({ wilayaCode: 16, communeId: 1601, near: { lat: 36.7, lng: 3.1 } })).toBe(
      'wilayaCode=16&limit=20&lat=36.70000&lng=3.10000',
    );
  });

  it('frames the desk on OpenStreetMap', () => {
    expect(osmEmbedUrl({ lat: 36.7, lng: 3.1 })).toContain('marker=36.70000%2C3.10000');
  });
});
