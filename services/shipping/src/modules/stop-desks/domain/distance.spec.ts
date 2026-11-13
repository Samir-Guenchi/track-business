import { describe, expect, it } from 'vitest';
import { byDistance, distanceKm } from './distance.js';

describe('distance', () => {
  it('measures Algiers to Oran at about 350 km', () => {
    const km = distanceKm({ lat: 36.7538, lng: 3.0588 }, { lat: 35.6971, lng: -0.6308 });
    expect(km).toBeGreaterThan(340);
    expect(km).toBeLessThan(360);
  });

  it('sorts nearest first and desks without GPS last', () => {
    const desks = [
      { name: 'B', distanceKm: null },
      { name: 'C', distanceKm: 4 },
      { name: 'A', distanceKm: 1.5 },
      { name: 'A0', distanceKm: null },
    ];
    expect([...desks].sort(byDistance).map((desk) => desk.name)).toEqual(['A', 'C', 'A0', 'B']);
  });
});
