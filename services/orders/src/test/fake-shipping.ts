import { type Server, createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { StorePricesResponse } from '@trackecom/contracts';

export interface FakeShipping {
  readonly url: string;
  close(): Promise<void>;
}

const STORE_PRICES = /^\/internal\/stores\/[\w-]+\/pricing\/store-prices$/;

/**
 * Answers `GET /geo/wilayas/:code/communes` from a map of wilaya code to commune ids and, when
 * given, the internal store-prices read (#134) for any store.
 */
export async function startFakeShipping(
  communes: Readonly<Record<number, readonly number[]>>,
  prices?: StorePricesResponse,
): Promise<FakeShipping> {
  const server: Server = createServer((request, response) => {
    if (prices && STORE_PRICES.test(request.url ?? '')) {
      response.writeHead(200, { 'content-type': 'application/json' });
      return void response.end(JSON.stringify(prices));
    }
    const code = Number(/^\/geo\/wilayas\/(\d+)\/communes$/.exec(request.url ?? '')?.[1]);
    const ids = communes[code];
    if (!ids) return void response.writeHead(404).end();
    const items = ids.map((id) => ({ id, wilayaCode: code, nameFr: `C${id}`, nameAr: `C${id}` }));
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ items }));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}
