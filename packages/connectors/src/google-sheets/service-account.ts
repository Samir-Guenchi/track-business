import { createSign } from 'node:crypto';
import { ConnectorError } from '../connector.errors.js';
import type { FetchLike } from '../shopify/shopify-client.js';
import { SHEETS_CODE } from './sheet-url.js';

/** The two fields of a Google service-account key file that signing needs. */
export interface ServiceAccountKey {
  readonly client_email: string;
  readonly private_key: string;
}

export type AccessTokens = () => Promise<string>;

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';
const LIFETIME_S = 3600;
const EARLY_S = 60;

const base64url = (value: string | Buffer) => Buffer.from(value).toString('base64url');

/**
 * Access tokens for TrackEcom's own service account (read-only Sheets scope). Sellers share
 * their order sheet with the account's email; no seller OAuth token is ever stored. A token is
 * reused until a minute before it expires.
 */
export class ServiceAccountTokens {
  private cached: { token: string; until: number } | null = null;

  constructor(
    private readonly key: ServiceAccountKey,
    private readonly fetchImpl: FetchLike = (url, init) => globalThis.fetch(url, init),
  ) {}

  readonly token: AccessTokens = async () => {
    const now = Math.floor(Date.now() / 1000);
    if (this.cached && this.cached.until > now) return this.cached.token;
    const response = await this.fetchImpl(TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: this.assertion(now),
      }).toString(),
    });
    if (!response.ok) {
      throw new ConnectorError('auth', `Google refused the service account (${response.status})`, {
        connector: SHEETS_CODE,
      });
    }
    const body = (await response.json()) as { access_token: string; expires_in: number };
    this.cached = { token: body.access_token, until: now + body.expires_in - EARLY_S };
    return body.access_token;
  };

  private assertion(now: number): string {
    const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claims = base64url(
      JSON.stringify({
        iss: this.key.client_email,
        scope: SCOPE,
        aud: TOKEN_URL,
        iat: now,
        exp: now + LIFETIME_S,
      }),
    );
    const signature = createSign('RSA-SHA256')
      .update(`${header}.${claims}`)
      .sign(this.key.private_key);
    return `${header}.${claims}.${base64url(signature)}`;
  }
}
