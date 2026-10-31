import type { StoreRole } from '@trackecom/contracts';

/** Who is acting, in which store, with which role. Built by the authorization guard only. */
export interface StoreContext {
  readonly storeId: string;
  readonly userId: string;
  readonly role: StoreRole;
  readonly ip: string | null;
}
