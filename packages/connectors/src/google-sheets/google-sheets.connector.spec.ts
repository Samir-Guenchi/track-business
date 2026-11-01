import { generateKeyPairSync, createVerify } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ConnectorError } from '../connector.errors.js';
import type { FetchLike } from '../shopify/shopify-client.js';
import { GoogleSheetsConnector } from './google-sheets.connector.js';
import { ServiceAccountTokens } from './service-account.js';

const SHEET_ID = 'aBcDeFgHiJkLmNoPqRsTuVwXyZ012345';
const ctx = (link = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=7`) => ({
  storeId: 'store',
  shopUrl: link,
  credentials: {},
});
const VALUES = [
  ['Nom', 'Téléphone', 'Wilaya', 'Produit', 'Prix'],
  ['Client Test', '0555000001', 'Oran', 'Robe', '2500'],
];

function fakeGoogle(status = 200) {
  const urls: string[] = [];
  const fetch: FetchLike = async (url) => {
    urls.push(decodeURIComponent(url));
    if (status !== 200) return new Response('{}', { status });
    const body = url.includes('/values/')
      ? { values: VALUES }
      : {
          properties: { title: 'Commandes' },
          sheets: [
            { properties: { sheetId: 0, title: 'Archive' } },
            { properties: { sheetId: 7, title: "Juin '26" } },
          ],
        };
    return new Response(JSON.stringify(body), { status: 200 });
  };
  return { connector: new GoogleSheetsConnector({ tokens: async () => 'token', fetch }), urls };
}

describe('GoogleSheetsConnector', () => {
  it('reads the tab the link points at', async () => {
    const { connector, urls } = fakeGoogle();

    expect(await connector.validate(ctx())).toEqual({ name: 'Commandes', currency: 'DZD' });
    const page = await connector.listOrders(ctx());

    expect(page.nextCursor).toBeNull();
    expect(page.orders[0]?.customer).toMatchObject({ name: 'Client Test', province: 'Oran' });
    expect(urls.at(-1)).toContain(`${SHEET_ID}/values/'Juin ''26'!A1:Z5000`);
  });

  it('refuses links that are not Google Sheets', async () => {
    const { connector } = fakeGoogle();

    await expect(
      connector.validate(ctx('https://evil.example/spreadsheets/d/x')),
    ).rejects.toMatchObject({
      kind: 'validation',
    });
  });

  it('reports an unshared sheet as an auth problem the seller can fix', async () => {
    const { connector } = fakeGoogle(403);

    await expect(connector.listOrders(ctx())).rejects.toBeInstanceOf(ConnectorError);
    await expect(connector.listOrders(ctx())).rejects.toMatchObject({ kind: 'auth' });
  });
});

describe('ServiceAccountTokens', () => {
  it('signs a read-only grant and reuses the token until it expires', async () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const key = {
      client_email: 'reader@test-project.iam.gserviceaccount.com',
      private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    };
    let grants = 0;
    const fetch: FetchLike = async (_url, init) => {
      grants += 1;
      const assertion = new URLSearchParams(String(init.body)).get('assertion') ?? '';
      const [header = '', claims = '', signature = ''] = assertion.split('.');
      const valid = createVerify('RSA-SHA256')
        .update(`${header}.${claims}`)
        .verify(publicKey, Buffer.from(signature, 'base64url'));
      const scope = JSON.parse(Buffer.from(claims, 'base64url').toString()).scope as string;
      const ok = valid && scope.endsWith('spreadsheets.readonly');
      return new Response(
        JSON.stringify({ access_token: ok ? 'granted' : 'no', expires_in: 3600 }),
      );
    };
    const tokens = new ServiceAccountTokens(key, fetch);

    expect(await tokens.token()).toBe('granted');
    expect(await tokens.token()).toBe('granted');
    expect(grants).toBe(1);
  });
});
