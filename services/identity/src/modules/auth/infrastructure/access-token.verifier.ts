import { Injectable } from '@nestjs/common';
import { AccessTokenClaimsSchema } from '@trackecom/contracts';
import { createLocalJWKSet, jwtVerify } from 'jose';
import { InvalidTokenError } from '../domain/auth.errors.js';
import { ACCESS_TOKEN_ALG, AccessTokenKeys } from './access-token.keys.js';
import { ACCESS_TOKEN_AUDIENCE, ACCESS_TOKEN_ISSUER } from './jose-access-token.issuer.js';

/** Verifies access tokens with the public JWKS, exactly as the other services will. */
@Injectable()
export class AccessTokenVerifier {
  constructor(private readonly keys: AccessTokenKeys) {}

  async verify(token: string): Promise<{ userId: string }> {
    try {
      const { payload } = await jwtVerify(token, createLocalJWKSet(this.keys.jwks()), {
        algorithms: [ACCESS_TOKEN_ALG],
        issuer: ACCESS_TOKEN_ISSUER,
        audience: ACCESS_TOKEN_AUDIENCE,
      });
      return { userId: AccessTokenClaimsSchema.parse(payload).sub };
    } catch {
      throw new InvalidTokenError();
    }
  }
}
