import { type Server, createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

export interface FakeGeo {
  readonly url: string;
  close(): Promise<void>;
}

const WILAYAS = [
  { code: 16, nameFr: 'Alger', nameAr: 'الجزائر' },
  { code: 31, nameFr: 'Oran', nameAr: 'وهران' },
];
const COMMUNES: Record<string, object[]> = {
  '16': [
    { id: 1601, wilayaCode: 16, nameFr: 'Alger Centre', nameAr: 'الجزائر الوسطى' },
    { id: 1621, wilayaCode: 16, nameFr: 'Bab Ezzouar', nameAr: 'باب الزوار' },
  ],
  '31': [{ id: 3101, wilayaCode: 31, nameFr: 'Oran', nameAr: 'وهران' }],
};

/** Answers shipping's two geo routes with a few made-up places. */
export async function startFakeGeo(): Promise<FakeGeo> {
  const server: Server = createServer((request, response) => {
    const url = request.url ?? '';
    const code = /^\/geo\/wilayas\/(\d+)\/communes$/.exec(url)?.[1];
    const items = url === '/geo/wilayas' ? WILAYAS : code ? COMMUNES[code] : undefined;
    if (!items) return void response.writeHead(404).end();
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
