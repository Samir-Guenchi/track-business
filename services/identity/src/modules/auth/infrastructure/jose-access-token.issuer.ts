import { Inject, Injectable } from '@nestjs/common';
import { SignJWT } from 'jose';
import {
  AUTH_PORTS,
  type AccessTokenIssuer,
  type Clock,
  type IssuedAccessToken,
} from '../application/ports/auth.ports.js';
import { ACCESS_TOKEN_ALG, AccessTokenKeys } from './access-token.keys.js';

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const ACCESS_TOKEN_ISSUER = 'trackecom-identity';
export const ACCESS_TOKEN_AUDIENCE = 'trackecom';

@Injectable()
export class JoseAccessTokenIssuer implements AccessTokenIssuer {
  constructor(
    private readonly keys: AccessTokenKeys,
    @Inject(AUTH_PORTS.clock) private readonly now: Clock,
  ) {}

  async issue(userId: string): Promise<IssuedAccessToken> {
    const issuedAt = Math.floor(this.now().getTime() / 1000);
    const expiresAt = issuedAt + ACCESS_TOKEN_TTL_SECONDS;
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: ACCESS_TOKEN_ALG, kid: this.keys.kid })
      .setSubject(userId)
      .setIssuer(ACCESS_TOKEN_ISSUER)
      .setAudience(ACCESS_TOKEN_AUDIENCE)
      .setIssuedAt(issuedAt)
      .setExpirationTime(expiresAt)
      .sign(this.keys.privateKey);
    return { token, expiresAt: new Date(expiresAt * 1000) };
  }
}
