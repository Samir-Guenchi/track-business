import type { StoreRole } from '@trackecom/contracts';
import Fastify, { type FastifyInstance } from 'fastify';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';

/** Members by user id: storeId -> role. */
export type Memberships = Record<string, Record<string, StoreRole>>;

export interface FakeIdentity {
  readonly url: string;
  tokenFor(userId: string): Promise<string>;
  close(): Promise<void>;
}

/** Test helper (import from @trackecom/service-kit/testing): a stand-in for identity with real ES256 tokens, JWKS and `GET /stores`. */
export async function startFakeIdentity(memberships: Memberships): Promise<FakeIdentity> {
  const { privateKey, publicKey } = await generateKeyPair('ES256');
  const jwk = { ...(await exportJWK(publicKey)), kid: 'test', alg: 'ES256', use: 'sig' };
  const server: FastifyInstance = Fastify();
  server.get('/.well-known/jwks.json', () => ({ keys: [jwk] }));
  server.get('/stores', (request) => {
    const userId = String(request.headers['x-test-user'] ?? '');
    const roles = memberships[userId] ?? {};
    return {
      items: Object.entries(roles).map(([id, role]) => ({
        store: { id, name: 'Store', createdAt: new Date(0).toISOString() },
        role,
      })),
    };
  });
  const tokens = new Map<string, string>();
  server.addHook('onRequest', async (request) => {
    const bearer = request.headers.authorization?.replace('Bearer ', '') ?? '';
    request.headers['x-test-user'] = tokens.get(bearer) ?? '';
  });
  const url = await server.listen({ port: 0, host: '127.0.0.1' });
  return {
    url,
    async tokenFor(userId) {
      const token = await new SignJWT({})
        .setProtectedHeader({ alg: 'ES256', kid: 'test' })
        .setSubject(userId)
        .setIssuer('trackecom-identity')
        .setAudience('trackecom')
        .setIssuedAt()
        .setExpirationTime('5m')
        .sign(privateKey);
      tokens.set(token, userId);
      return token;
    },
    close: () => server.close(),
  };
}
