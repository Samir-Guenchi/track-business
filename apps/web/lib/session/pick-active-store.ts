import type { MyStoresResponse } from '@trackecom/contracts';

/** Keeps the remembered store if the user still belongs to it, otherwise the first one. */
export function pickActiveStore(
  remembered: string | null,
  stores: MyStoresResponse['items'],
): string | null {
  if (remembered && stores.some(({ store }) => store.id === remembered)) return remembered;
  return stores[0]?.store.id ?? null;
}
