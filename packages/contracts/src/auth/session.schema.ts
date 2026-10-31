import { z } from 'zod';
import { LocaleSchema } from './credentials.schema.js';

/**
 * Web clients get both tokens as httpOnly cookies and can ignore this body. Mobile clients
 * (header `x-client-type: mobile`) also receive the refresh token here.
 */
export const SessionResponseSchema = z.strictObject({
  accessToken: z.string().min(1),
  accessTokenExpiresAt: z.iso.datetime(),
  refreshToken: z.string().min(1).optional(),
});
export type SessionResponse = z.infer<typeof SessionResponseSchema>;

/** Body is optional: web sends the refresh cookie instead. */
export const RefreshRequestSchema = z.strictObject({
  refreshToken: z.string().min(20).max(200).optional(),
});
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;

export const MeResponseSchema = z.strictObject({
  id: z.string().min(1),
  email: z.string(),
  name: z.string(),
  phone: z.string().nullable(),
  locale: LocaleSchema,
  emailVerified: z.boolean(),
});
export type MeResponse = z.infer<typeof MeResponseSchema>;

/** Claims of the ES256 access token; services verify it locally with the JWKS. */
export const AccessTokenClaimsSchema = z.object({
  sub: z.string().min(1),
  iss: z.literal('trackecom-identity'),
  aud: z.literal('trackecom'),
  exp: z.number().int(),
  iat: z.number().int(),
});
export type AccessTokenClaims = z.infer<typeof AccessTokenClaimsSchema>;
