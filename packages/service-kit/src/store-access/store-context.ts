import type { StoreRole } from '@trackecom/contracts';

/** Who is acting, in which store, with which role. Built by the guard, never from the body. */
export interface StoreContext {
  readonly storeId: string;
  readonly userId: string;
  readonly role: StoreRole;
  readonly ip: string;
}
