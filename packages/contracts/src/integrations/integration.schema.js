import { z } from 'zod';
import {
  ConnectCarrierRequestSchema,
  CredentialFieldSchema,
} from '../carriers/carrier-account.schema.js';
/** Shop platforms and order sheets TrackEcom imports orders from (#47, #48, #26). */
export const CONNECTOR_CODES = ['shopify', 'woocommerce', 'youcan', 'google_sheets'];
export const ConnectorCodeSchema = z.enum(CONNECTOR_CODES);
/** `GET /integrations/connectors`: what the integrations page offers to connect. */
export const ConnectorInfoSchema = z.strictObject({
  code: ConnectorCodeSchema,
  name: z.string(),
  /** Empty for OAuth platforms: the page shows a "Connect" button instead of a form. */
  credentialFields: z.array(CredentialFieldSchema),
  webhooks: z.boolean(),
  fulfilment: z.boolean(),
});
export const INTEGRATION_STATUSES = ['connected', 'needs_reconnect', 'error'];
export const IntegrationStatusSchema = z.enum(INTEGRATION_STATUSES);
/** `GET /integrations`: one row per connected shop, with status, last sync and reconnect. */
export const IntegrationSchema = z.strictObject({
  id: z.uuid(),
  connector: ConnectorCodeSchema,
  shopUrl: z.string(),
  shopName: z.string(),
  status: IntegrationStatusSchema,
  lastSyncAt: z.iso.datetime().nullable(),
  ordersImported: z.number().int().nonnegative(),
  /** Why the last sync failed, as an error code the app translates; null when it worked. */
  lastError: z.string().nullable(),
});
export const ConnectorsResponseSchema = z.strictObject({ items: z.array(ConnectorInfoSchema) });
export const IntegrationsResponseSchema = z.strictObject({ items: z.array(IntegrationSchema) });
/**
 * `POST /integrations`: connects one shop. Credentials are checked against the shop, encrypted
 * at rest and never returned. Connecting the same shop again replaces its credentials.
 */
export const ConnectShopRequestSchema = z.strictObject({
  connector: ConnectorCodeSchema,
  /** e.g. `my-shop.myshopify.com`, `https://shop.dz` or a Google Sheets link (case matters). */
  shopUrl: z.string().trim().min(3).max(255),
  credentials: ConnectCarrierRequestSchema.shape.credentials,
});
