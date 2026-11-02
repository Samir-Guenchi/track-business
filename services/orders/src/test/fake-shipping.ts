import { type Server, createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

export interface FakeShipping {
  readonly url: string;
  close(): Promise<void>;
}

/** Answers `GET /geo/wilayas/:code/communes` from a map of wilaya code to commune ids. */
export async function startFakeShipping(
  communes: Readonly<Record<number, readonly number[]>>,
): Promise<FakeShipping> {
  const server: Server = createServer((request, response) => {
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
