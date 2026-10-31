import { Inject, Injectable } from '@nestjs/common';
import {
  AccessTokenClaimsSchema,
  MyStoresResponseSchema,
  type StoreRole,
} from '@trackecom/contracts';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { type Env, ENV } from '../config/env.schema.js';
import { InvalidTokenError } from './access.errors.js';

const ISSUER = 'trackecom-identity';
const AUDIENCE = 'trackecom';

/** The only place orders talks to identity: verify tokens and read the caller's store roles. */
@Injectable()
export class IdentityClient {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(@Inject(ENV) private readonly env: Env) {
    this.jwks = createRemoteJWKSet(new URL('/.well-known/jwks.json', env.IDENTITY_URL), {
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
    const response = await fetch(new URL('/stores', this.env.IDENTITY_URL), {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(3000),
    });
    if (response.status === 401) throw new InvalidTokenError();
    if (!response.ok) throw new Error(`identity GET /stores answered ${response.status}`);
    const { items } = MyStoresResponseSchema.parse(await response.json());
    return Object.fromEntries(items.map(({ store, role }) => [store.id, role]));
  }
}
