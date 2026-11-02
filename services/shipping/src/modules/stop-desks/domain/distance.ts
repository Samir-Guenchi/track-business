/** A point on the map in degrees. */
export interface Point {
  readonly lat: number;
  readonly lng: number;
}

const EARTH_RADIUS_KM = 6371;
const rad = (degrees: number) => (degrees * Math.PI) / 180;

/** Straight-line distance in km (haversine), rounded to 0.1 km. */
export function distanceKm(from: Point, to: Point): number {
  const dLat = rad(to.lat - from.lat);
  const dLng = rad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a)) * 10) / 10;
}

/** About 60 km around the point: the box the database narrows to before distances are computed. */
export function searchBox(point: Point, degrees = 0.6) {
  return {
    lat: { gte: point.lat - degrees, lte: point.lat + degrees },
    lng: { gte: point.lng - degrees, lte: point.lng + degrees },
  };
}

/** Nearest first; desks without GPS go last, by name. */
export function byDistance<T extends { distanceKm: number | null; name: string }>(
  a: T,
  b: T,
): number {
  if (a.distanceKm === null || b.distanceKm === null) {
    if (a.distanceKm !== b.distanceKm) return a.distanceKm === null ? 1 : -1;
    return a.name.localeCompare(b.name);
  }
  return a.distanceKm - b.distanceKm;
}
