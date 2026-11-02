import { useQuery } from '@tanstack/react-query';
import { geoApi } from '../api/geo-api';

/** Reference data changes with a law, not with a click: cache it for the whole session. */
const FOREVER = Number.POSITIVE_INFINITY;

export function useWilayas() {
  return useQuery({ queryKey: ['geo', 'wilayas'], queryFn: geoApi.wilayas, staleTime: FOREVER });
}

export function useCommunes(wilayaCode: number | undefined) {
  return useQuery({
    queryKey: ['geo', 'communes', wilayaCode],
    queryFn: () => geoApi.communes(wilayaCode ?? 0),
    enabled: wilayaCode !== undefined,
    staleTime: FOREVER,
  });
}

/** "16 · Alger" or "16 · الجزائر". */
export function wilayaLabel(
  wilaya: { code: number; nameAr: string; nameFr: string },
  locale: string,
): string {
  const name = locale === 'ar' ? wilaya.nameAr : wilaya.nameFr;
  return `${String(wilaya.code).padStart(2, '0')} · ${name}`;
}
