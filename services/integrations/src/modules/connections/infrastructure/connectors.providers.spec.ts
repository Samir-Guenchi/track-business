import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { testEnv } from '../../../test/test-app.js';
import { storeConnectors } from './connectors.providers.js';

const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const KEY = JSON.stringify({
  client_email: 'reader@test-project.iam.gserviceaccount.com',
  private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
});

describe('store connectors', () => {
  it('offers Google Sheets only once a service account is configured', () => {
    const without = storeConnectors(testEnv(), null).map((connector) => connector.code);
    const withKey = storeConnectors(testEnv({ GOOGLE_SERVICE_ACCOUNT_JSON: KEY }), null);

    expect(without).toEqual(['shopify']);
    expect(withKey.map((connector) => connector.code)).toEqual(['shopify', 'google_sheets']);
  });

  it('refuses a key file that is not a service account', () => {
    expect(() => testEnv({ GOOGLE_SERVICE_ACCOUNT_JSON: '{"client_email":"x"}' })).toThrow();
    expect(() => testEnv({ GOOGLE_SERVICE_ACCOUNT_JSON: 'not json' })).toThrow();
  });
});
