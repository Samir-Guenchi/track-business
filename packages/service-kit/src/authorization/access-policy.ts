import { SetMetadata } from '@nestjs/common';

/**
 * Every route declares who may call it. A service's global guard denies any route without a
 * policy (deny by default, secure-coding skill).
 */
export type AccessPolicy =
  | { readonly kind: 'public' }
  | { readonly kind: 'authenticated' }
  | { readonly kind: 'permission'; readonly permission: string };

export const ACCESS_POLICY_KEY = 'trackecom:access-policy';

/** Anyone, signed in or not (health, login, public reference data). */
export const Public = () =>
  SetMetadata(ACCESS_POLICY_KEY, { kind: 'public' } satisfies AccessPolicy);

/** Any signed-in user, no store needed (create a store, list my stores). */
export const Authenticated = () =>
  SetMetadata(ACCESS_POLICY_KEY, { kind: 'authenticated' } satisfies AccessPolicy);

/** A member of the selected store whose role has this permission (see ROLE_PERMISSIONS). */
export const RequirePermission = (permission: string) =>
  SetMetadata(ACCESS_POLICY_KEY, { kind: 'permission', permission } satisfies AccessPolicy);
