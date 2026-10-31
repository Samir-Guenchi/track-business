import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { type CryptoKey, type JWK, exportJWK, generateKeyPair, importPKCS8 } from 'jose';
import { type Env, ENV } from '../../../config/env.schema.js';

export const ACCESS_TOKEN_ALG = 'ES256';

/** Holds the signing key and publishes the public half as a JWKS for the other services. */
@Injectable()
export class AccessTokenKeys implements OnModuleInit {
  private readonly logger = new Logger(AccessTokenKeys.name);
  private signingKey: CryptoKey | undefined;
  private publicJwk: JWK | undefined;

  constructor(@Inject(ENV) private readonly env: Env) {}

  async onModuleInit(): Promise<void> {
    const pem = this.env.JWT_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const privateKey = pem
      ? await importPKCS8(pem, ACCESS_TOKEN_ALG, { extractable: true })
      : await this.throwaway();
    const publicJwk = await exportJWK(privateKey);
    delete publicJwk.d;
    this.signingKey = privateKey;
    this.publicJwk = { ...publicJwk, kid: this.env.JWT_KEY_ID, alg: ACCESS_TOKEN_ALG, use: 'sig' };
  }

  get kid(): string {
    return this.env.JWT_KEY_ID;
  }

  get privateKey(): CryptoKey {
    if (!this.signingKey) throw new Error('AccessTokenKeys used before module init');
    return this.signingKey;
  }

  jwks(): { keys: JWK[] } {
    return { keys: this.publicJwk ? [this.publicJwk] : [] };
  }

  private async throwaway(): Promise<CryptoKey> {
    this.logger.warn('JWT_PRIVATE_KEY not set: using a throwaway key (sessions end on restart)');
    const { privateKey } = await generateKeyPair(ACCESS_TOKEN_ALG, { extractable: true });
    return privateKey;
  }
}
