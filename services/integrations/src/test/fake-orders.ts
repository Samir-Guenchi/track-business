import { type Server, createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

export interface FakeOrders {
  readonly url: string;
  close(): Promise<void>;
}

/** Answers orders' internal origin route from a map of order id to source and shop id. */
export async function startFakeOrders(
  token: string,
  origins: Readonly<Record<string, { source: string; externalRef: string | null }>>,
): Promise<FakeOrders> {
  const server: Server = createServer((request, response) => {
    if (request.headers['x-internal-token'] !== token) return void response.writeHead(401).end();
    const orderId = /^\/internal\/stores\/[^/]+\/orders\/([^/]+)\/origin$/.exec(
      request.url ?? '',
    )?.[1];
    const origin = orderId ? origins[orderId] : undefined;
    if (!orderId || !origin) return void response.writeHead(404).end();
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ orderId, ...origin }));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}
