import { createHash, randomBytes } from 'node:crypto';

/** 24 random bytes: 32 URL-safe characters, unguessable. */
export const newToken = (): string => randomBytes(24).toString('base64url');

export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');
