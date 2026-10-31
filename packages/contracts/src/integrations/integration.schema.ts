import { z } from 'zod';
import { CredentialFieldSchema } from '../carriers/carrier-account.schema.js';

/** Shop platforms TrackEcom imports orders from (#47, #48). */
export const CONNECTOR_CODES = ['shopify', 'woocommerce', 'youcan'] as const;
export const ConnectorCodeSchema = z.enum(CONNECTOR_CODES);
export type ConnectorCode = z.infer<typeof ConnectorCodeSchema>;

/** `GET /integrations/connectors`: what the integrations page offers to connect. */
export const ConnectorInfoSchema = z.strictObject({
  code: ConnectorCodeSchema,
  name: z.string(),
  /** Empty for OAuth platforms: the page shows a "Connect" button instead of a form. */
  credentialFields: z.array(CredentialFieldSchema),
  webhooks: z.boolean(),
  fulfilment: z.boolean(),
});
export type ConnectorInfo = z.infer<typeof ConnectorInfoSchema>;

export const INTEGRATION_STATUSES = ['connected', 'needs_reconnect', 'error'] as const;
export const IntegrationStatusSchema = z.enum(INTEGRATION_STATUSES);
export type IntegrationStatus = z.infer<typeof IntegrationStatusSchema>;

/** `GET /integrations`: one row per connected shop, with status, last sync and reconnect. */
export const IntegrationSchema = z.strictObject({
  connector: ConnectorCodeSchema,
  shopUrl: z.string(),
  shopName: z.string(),
  status: IntegrationStatusSchema,
  lastSyncAt: z.iso.datetime().nullable(),
  ordersImported: z.number().int().nonnegative(),
  /** Why the last sync failed, as an error code the app translates; null when it worked. */
  lastError: z.string().nullable(),
});
export type Integration = z.infer<typeof IntegrationSchema>;
