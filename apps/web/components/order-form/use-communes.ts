'use client';

import type { Commune } from '@trackecom/contracts';
import { useEffect, useState } from 'react';
import { apiBaseUrl } from '../../lib/api/api-base-url';

/** Communes of the picked wilaya, fetched once per wilaya (plain fetch: no query library here). */
export function useCommunes(wilayaCode: number | undefined): readonly Commune[] {
  const [communes, setCommunes] = useState<readonly Commune[]>([]);
  useEffect(() => {
    setCommunes([]);
    if (wilayaCode === undefined) return;
    const controller = new AbortController();
    fetch(`${apiBaseUrl}/geo/wilayas/${wilayaCode}/communes`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { items: [] }))
      .then((body: { items: Commune[] }) => setCommunes(body.items))
      .catch(() => undefined);
    return () => controller.abort();
  }, [wilayaCode]);
  return communes;
}
