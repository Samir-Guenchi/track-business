import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { MeResponseSchema, SessionResponseSchema } from '@trackecom/contracts';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { AUTH_PORTS, type AuthEmail, type AuthMailer } from './application/ports/auth.ports.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const MOBILE = { 'x-client-type': 'mobile' };
const amina = {
  email: 'amina@example.dz',
  password: 'colis rapide vers Oran',
  name: 'Amina Test',
  phone: '0555 00 00 01',
  locale: 'fr',
};

describe.skipIf(!baseUrl || !redisUrl)('auth flows (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=identity_auth_test`;
  const sent: AuthEmail[] = [];
  let app: NestFastifyApplication;

  let requestCount = 0;
  // A different client IP per request, so the per-IP route limit does not hide the lockout.
  const post = (url: string, payload: object, headers: Record<string, string> = MOBILE) => {
    requestCount += 1;
    return app.inject({
      method: 'POST',
      url,
      payload,
      headers,
      remoteAddress: `10.0.${requestCount}.1`,
    });
  };
  const lastToken = (kind: AuthEmail['kind']) =>
    [...sent].reverse().find((email) => email.kind === kind)?.token ?? '';

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    app = await startTestApp(
      testEnv({ DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, RATE_LIMIT_PER_MINUTE: '1000' }),
    );
    await app.get(PrismaService).user.deleteMany();
    const mailer = app.get<AuthMailer>(AUTH_PORTS.mailer, { strict: false });
    vi.spyOn(mailer, 'send').mockImplementation(async (email) => void sent.push(email));
  });

  afterAll(async () => {
    await app?.close();
  });

  it('registers, sends a French verification email and returns a session', async () => {
    const response = await post('/auth/register', amina);

    expect(response.statusCode).toBe(201);
    expect(SessionResponseSchema.parse(response.json()).refreshToken).toBeDefined();
    expect(sent[0]).toMatchObject({ kind: 'verify_email', to: 'amina@example.dz', locale: 'fr' });
  });

  it('refuses a second account with the same email in another case', async () => {
    const response = await post('/auth/register', { ...amina, email: 'AMINA@example.dz' });

    expect(response.json()).toMatchObject({ error: { code: 'auth.email_taken' } });
  });

  it('verifies the email once', async () => {
    const token = lastToken('verify_email');

    expect((await post('/auth/verify-email', { token })).statusCode).toBe(204);
    expect((await post('/auth/verify-email', { token })).statusCode).toBe(401);
  });

  it('logs in and reads the profile with the access token, without exposing the hash', async () => {
    const login = await post('/auth/login', { email: amina.email, password: amina.password });
    const { accessToken } = SessionResponseSchema.parse(login.json());

    const me = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(MeResponseSchema.parse(me.json())).toMatchObject({
      phone: '+213555000001',
      emailVerified: true,
    });
  });

  it('sets httpOnly cookies for web clients and keeps the refresh token out of the body', async () => {
    const login = await post('/auth/login', { email: amina.email, password: amina.password }, {});

    expect(login.json().refreshToken).toBeUndefined();
    expect(String(login.headers['set-cookie'])).toMatch(/te_refresh=.*HttpOnly.*SameSite=Lax/);
  });

  it('rotates refresh tokens and revokes the family when an old one is reused', async () => {
    const firstResponse = await post('/auth/login', {
      email: amina.email,
      password: amina.password,
    });
    const first = SessionResponseSchema.parse(firstResponse.json());
    const second = SessionResponseSchema.parse(
      (await post('/auth/refresh', { refreshToken: first.refreshToken })).json(),
    );

    const reuse = await post('/auth/refresh', { refreshToken: first.refreshToken });
    const afterTheft = await post('/auth/refresh', { refreshToken: second.refreshToken });

    expect(reuse.statusCode).toBe(401);
    expect(afterTheft.statusCode).toBe(401);
  });

  it('gives the same answer for an unknown email and a wrong password', async () => {
    const unknown = await post('/auth/login', {
      email: 'nobody@example.dz',
      password: 'whatever pass',
    });
    const wrong = await post('/auth/login', { email: amina.email, password: 'wrong password' });

    expect(unknown.json()).toEqual(wrong.json());
  });

  it('resets the password, signs out other sessions and accepts the new password', async () => {
    const before = await post('/auth/login', { email: amina.email, password: amina.password });
    const old = SessionResponseSchema.parse(before.json());
    expect((await post('/auth/forgot-password', { email: amina.email })).statusCode).toBe(202);

    const reset = await post('/auth/reset-password', {
      token: lastToken('reset_password'),
      password: 'nouveau colis pour Setif',
    });
    const oldRefresh = await post('/auth/refresh', { refreshToken: old.refreshToken });
    const login = await post('/auth/login', {
      email: amina.email,
      password: 'nouveau colis pour Setif',
    });

    expect([reset.statusCode, oldRefresh.statusCode, login.statusCode]).toEqual([204, 401, 200]);
  });

  it('rate limits login attempts from one IP', async () => {
    const attempt = () =>
      app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'x@example.dz', password: 'x' },
        remoteAddress: '10.9.9.9',
      });
    for (let i = 0; i < 10; i += 1) await attempt();

    const response = await attempt();

    expect(response.statusCode).toBe(429);
    expect(response.json()).toMatchObject({ error: { code: 'rate_limited' } });
  });

  it('locks the account after five wrong passwords', async () => {
    for (let i = 0; i < 5; i += 1)
      await post('/auth/login', { email: amina.email, password: `wrong ${i} pass` });

    const response = await post('/auth/login', {
      email: amina.email,
      password: 'nouveau colis pour Setif',
    });

    expect(response.statusCode).toBe(401);
  });
});
