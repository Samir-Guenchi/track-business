import { Inject, Injectable } from '@nestjs/common';
import {
  AccessTokenClaimsSchema,
  MyStoresResponseSchema,
  type StoreRole,
} from '@trackecom/contracts';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { InvalidTokenError } from './access.errors.js';
import { STORE_ACCESS_OPTIONS, type StoreAccessOptions } from './store-access.options.js';

const ISSUER = 'trackecom-identity';
const AUDIENCE = 'trackecom';

/** How a service talks to identity: verify access tokens and read the caller's store roles. */
@Injectable()
export class IdentityClient {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(@Inject(STORE_ACCESS_OPTIONS) private readonly options: StoreAccessOptions) {
    this.jwks = createRemoteJWKSet(new URL('/.well-known/jwks.json', options.identityUrl), {
      cacheMaxAge: 10 * 60_000,
    });
  }

  async verify(token: string): Promise<string> {
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        algorithms: ['ES256'],
        issuer: ISSUER,
        audience: AUDIENCE,
      });
      return AccessTokenClaimsSchema.parse(payload).sub;
    } catch {
      throw new InvalidTokenError();
    }
  }

  /** storeId -> role for every store of the token's user, as identity sees it now. */
  async rolesOf(token: string): Promise<Record<string, StoreRole>> {
    const response = await fetch(new URL('/stores', this.options.identityUrl), {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(3000),
    });
    if (response.status === 401) throw new InvalidTokenError();
    if (!response.ok) throw new Error(`identity GET /stores answered ${response.status}`);
    const { items } = MyStoresResponseSchema.parse(await response.json());
    return Object.fromEntries(items.map(({ store, role }) => [store.id, role]));
  }
}
