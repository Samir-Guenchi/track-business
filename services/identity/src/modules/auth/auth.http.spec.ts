import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp } from '../../test/test-app.js';

describe('auth HTTP boundary (no database needed)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unknown fields on register', async () => {
    const payload = {
      email: 'a@example.dz',
      password: 'long enough pass',
      name: 'Amina',
      role: 'owner',
    };

    const response = await app.inject({ method: 'POST', url: '/auth/register', payload });

    expect(response.statusCode).toBe(400);
  });

  it('rejects a password shorter than 10 characters', async () => {
    const payload = { email: 'a@example.dz', password: 'short', name: 'Amina' };

    const response = await app.inject({ method: 'POST', url: '/auth/register', payload });

    expect(response.json().error.details).toEqual([expect.objectContaining({ path: 'password' })]);
  });

  it('returns 401 on /auth/me without a token', async () => {
    const response = await app.inject({ method: 'GET', url: '/auth/me' });

    expect(response.json()).toMatchObject({ error: { code: 'auth.invalid_token' } });
    expect(response.statusCode).toBe(401);
  });

  it('returns 401 on /auth/me with a forged token', async () => {
    const headers = { authorization: 'Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJ4In0.' };

    const response = await app.inject({ method: 'GET', url: '/auth/me', headers });

    expect(response.statusCode).toBe(401);
  });

  it('publishes an ES256 public key without its private part', async () => {
    const response = await app.inject({ method: 'GET', url: '/.well-known/jwks.json' });

    const [key] = response.json().keys;
    expect(key).toMatchObject({ kty: 'EC', crv: 'P-256', alg: 'ES256', kid: 'identity-1' });
    expect(key).not.toHaveProperty('d');
  });
});
