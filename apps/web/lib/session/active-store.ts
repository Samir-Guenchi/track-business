const STORAGE_KEY = 'trackecom-active-store';
let activeStoreId: string | null = null;

/**
 * The store the seller is working in. Sent as `x-store-id`; identity checks membership on
 * every request, so this is a preference, not a permission.
 */
export function getActiveStoreId(): string | null {
  if (activeStoreId !== null || typeof window === 'undefined') return activeStoreId;
  try {
    activeStoreId = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage blocked: the gate picks the first store again on each visit.
  }
  return activeStoreId;
}

export function setActiveStoreId(storeId: string | null): void {
  activeStoreId = storeId;
  try {
    if (storeId === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, storeId);
  } catch {
    // Storage blocked: the choice lasts for this page view.
  }
}
