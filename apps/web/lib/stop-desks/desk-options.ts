import { mapLinkOf, type StopDesk } from '@trackecom/contracts';
import type { StopDeskOption } from '@trackecom/ui';

export interface DeskQuery {
  readonly wilayaCode: number;
  readonly communeId?: number | undefined;
  readonly near?: { readonly lat: number; readonly lng: number } | undefined;
}

/** `/geo/stop-desks` query: the commune's desks first; with a point, the nearest in the wilaya. */
export function deskSearch({ wilayaCode, communeId, near }: DeskQuery): string {
  const params = new URLSearchParams({ wilayaCode: String(wilayaCode), limit: '20' });
  if (near) {
    params.set('lat', near.lat.toFixed(5));
    params.set('lng', near.lng.toFixed(5));
  } else if (communeId !== undefined) params.set('communeId', String(communeId));
  return params.toString();
}

const hoursText = (hours: StopDesk['hours']) =>
  hours
    ? Object.entries(hours)
        .map(([days, time]) => `${days} ${time}`)
        .join(' · ')
    : null;

/** A desk worded for the picker in the reader's language. */
export function toDeskOption(desk: StopDesk, locale: string): StopDeskOption {
  const commune = locale === 'ar' ? desk.communeNameAr : desk.communeNameFr;
  const located = desk.lat !== null && desk.lng !== null;
  return {
    id: desk.id,
    name: desk.name,
    address: desk.address,
    place: `${commune} · ${desk.carrier}`,
    hours: hoursText(desk.hours),
    distance: desk.distanceKm === null ? null : `${desk.distanceKm} km`,
    mapUrl: located ? mapLinkOf({ lat: desk.lat ?? 0, lng: desk.lng ?? 0 }) : null,
  };
}

/** A small OpenStreetMap view of one desk, no API key or script needed. */
export function osmEmbedUrl(point: { lat: number; lng: number }): string {
  const d = 0.004;
  const bbox = [point.lng - d, point.lat - d, point.lng + d, point.lat + d].map((n) =>
    n.toFixed(5),
  );
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox.join('%2C')}&layer=mapnik&marker=${point.lat.toFixed(5)}%2C${point.lng.toFixed(5)}`;
}
