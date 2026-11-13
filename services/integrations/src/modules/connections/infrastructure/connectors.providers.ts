import type { Provider } from '@nestjs/common';
import {
  ConnectorRegistry,
  GoogleSheetsConnector,
  ServiceAccountTokens,
  ShopifyConnector,
  type StoreConnector,
} from '@trackecom/connectors';
import { FakeConnector } from '@trackecom/connectors/testing';
import { type Env, ENV } from '../../../config/env.schema.js';
import { EnvelopeCipher } from './envelope-cipher.js';

/**
 * The in-memory shop for local development and tests. It answers as `woocommerce` until that
 * connector exists (#48), so it never shadows the real Shopify connector.
 */
export const FAKE_CONNECTOR = Symbol('FakeConnector');

/** The current key plus retired ones, so rows sealed before a rotation still open. */
export function keyEncryptionKeys(env: Env): Map<string, Buffer> {
  const previous = (env.SHOP_KEK_PREVIOUS ?? '')
    .split(',')
    .filter(Boolean)
    .map((entry): [string, Buffer] => {
      const [id = '', key = ''] = entry.split(':');
      return [id, Buffer.from(key, 'base64')];
    });
  return new Map([...previous, [env.SHOP_KEK_ID, Buffer.from(env.SHOP_KEK, 'base64')]]);
}

/** Shopify always; Google Sheets once a service account is configured; the fake in dev. */
export function storeConnectors(env: Env, fake: FakeConnector | null): StoreConnector[] {
  const key = env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const sheets = key
    ? [new GoogleSheetsConnector({ tokens: new ServiceAccountTokens(key).token })]
    : [];
  return [new ShopifyConnector(), ...sheets, ...(fake ? [fake] : [])];
}

export const connectorProviders: Provider[] = [
  {
    provide: FAKE_CONNECTOR,
    inject: [ENV],
    useFactory: (env: Env) => (env.ENABLE_FAKE_CONNECTOR ? new FakeConnector('woocommerce') : null),
  },
  {
    provide: ConnectorRegistry,
    inject: [ENV, FAKE_CONNECTOR],
    useFactory: (env: Env, fake: FakeConnector | null) =>
      new ConnectorRegistry(storeConnectors(env, fake)),
  },
  {
    provide: EnvelopeCipher,
    inject: [ENV],
    useFactory: (env: Env) => new EnvelopeCipher(keyEncryptionKeys(env), env.SHOP_KEK_ID),
  },
];
