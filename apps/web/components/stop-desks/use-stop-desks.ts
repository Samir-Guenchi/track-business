'use client';

import { ListStopDesksResponseSchema, type StopDesk } from '@trackecom/contracts';
import { useEffect, useState } from 'react';
import { apiBaseUrl } from '../../lib/api/api-base-url';
import { deskSearch } from '../../lib/stop-desks/desk-options';

type Point = { readonly lat: number; readonly lng: number };

/**
 * Desks of the commune (or of the wilaya when the commune has none), and nearest-first once the
 * customer shares their position. Plain fetch: the public form has no query library.
 */
export function useStopDesks(wilayaCode: number | undefined, communeId: number | undefined) {
  const [desks, setDesks] = useState<readonly StopDesk[]>([]);
  const [near, setNear] = useState<Point | undefined>();
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    setDesks([]);
    if (wilayaCode === undefined) return;
    const controller = new AbortController();
    const load = async (query: string) => {
      const response = await fetch(`${apiBaseUrl}/geo/stop-desks?${query}`, {
        signal: controller.signal,
      });
      return response.ok ? ListStopDesksResponseSchema.parse(await response.json()).items : [];
    };
    (async () => {
      const own = await load(deskSearch({ wilayaCode, communeId, near }));
      setDesks(own.length > 0 || near ? own : await load(deskSearch({ wilayaCode })));
    })().catch(() => undefined);
    return () => controller.abort();
  }, [wilayaCode, communeId, near]);

  const locate = () => {
    if (!('geolocation' in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setNear({ lat: coords.latitude, lng: coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 10_000 },
    );
  };

  return { desks, locate, locating };
}
