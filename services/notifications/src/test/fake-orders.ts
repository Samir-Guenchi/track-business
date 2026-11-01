import { type Server, createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { OrderContact } from '@trackecom/contracts';

export interface FakeOrders {
  readonly url: string;
  /** Header values seen, to check the internal token is sent. */
  readonly tokens: string[];
  close(): Promise<void>;
}

/** Answers orders' internal contact route from a map of order id to contact. */
export async function startFakeOrders(
  contacts: Readonly<Record<string, OrderContact>>,
): Promise<FakeOrders> {
  const tokens: string[] = [];
  const server: Server = createServer((request, response) => {
    tokens.push(String(request.headers['x-internal-token'] ?? ''));
    const orderId = /\/orders\/([^/]+)\/contact$/.exec(request.url ?? '')?.[1] ?? '';
    const contact = contacts[orderId];
    if (!contact) return void response.writeHead(404).end();
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify(contact));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    tokens,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}
