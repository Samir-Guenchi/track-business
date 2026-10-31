import { createHash, randomBytes } from 'node:crypto';

/** 256 bits of randomness, URL-safe. Only its hash is stored. */
export function newRawToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Tokens are high-entropy, so a fast hash is enough (no salt or argon2 needed). */
export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}
