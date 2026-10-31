import { z } from 'zod';

/** One field a seller fills to connect a carrier (e.g. Yalidine: API id and API token). */
export const CredentialFieldSchema = z.strictObject({
  key: z.string().regex(/^[a-zA-Z][a-zA-Z0-9]{0,39}$/),
  label: z.string(),
  /** Shown as a password field and never sent back by the API. */
  secret: z.boolean(),
});
export type CredentialField = z.infer<typeof CredentialFieldSchema>;

/** `GET /carriers`: carriers TrackEcom can connect to, with the fields each one needs. */
export const AvailableCarriersResponseSchema = z.strictObject({
  items: z.array(
    z.strictObject({
      code: z.string(),
      name: z.string(),
      credentialFields: z.array(CredentialFieldSchema),
      capabilities: z.strictObject({
        webhooks: z.boolean(),
        cancel: z.boolean(),
        labels: z.boolean(),
        rates: z.boolean(),
      }),
    }),
  ),
});
export type AvailableCarriersResponse = z.infer<typeof AvailableCarriersResponseSchema>;

/**
 * `PUT /carriers/accounts/:carrier`: the store's own credentials. They are checked against the
 * carrier, encrypted at rest and never returned.
 */
export const ConnectCarrierRequestSchema = z.strictObject({
  credentials: z
    .record(z.string().regex(/^[a-zA-Z][a-zA-Z0-9]{0,39}$/), z.string().trim().min(1).max(500))
    .refine((credentials) => Object.keys(credentials).length <= 10, 'At most 10 fields'),
});
export type ConnectCarrierRequest = z.infer<typeof ConnectCarrierRequestSchema>;

/** A connected carrier as the settings screen shows it. No credential ever leaves the server. */
export const CarrierAccountSchema = z.strictObject({
  carrier: z.string(),
  /** Last characters of the first credential, e.g. "••••3f9a", so the seller knows which key. */
  hint: z.string(),
  verifiedAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type CarrierAccount = z.infer<typeof CarrierAccountSchema>;

export const CarrierAccountsResponseSchema = z.strictObject({
  items: z.array(CarrierAccountSchema),
});
export type CarrierAccountsResponse = z.infer<typeof CarrierAccountsResponseSchema>;
