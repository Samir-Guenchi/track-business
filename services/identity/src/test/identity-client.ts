import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { vi } from 'vitest';
import {
  AUTH_PORTS,
  type AuthEmail,
  type AuthMailer,
} from '../modules/auth/application/ports/auth.ports.js';

type Json = Record<string, unknown>;

/** Drives the identity API like a client would; captures outgoing emails instead of sending them. */
export class IdentityClient {
  readonly sent: AuthEmail[] = [];
  private requestCount = 0;

  constructor(private readonly app: NestFastifyApplication) {
    const mailer = app.get<AuthMailer>(AUTH_PORTS.mailer, { strict: false });
    vi.spyOn(mailer, 'send').mockImplementation(async (email) => void this.sent.push(email));
  }

  lastToken(kind: AuthEmail['kind'], to: string): string {
    return (
      [...this.sent].reverse().find((email) => email.kind === kind && email.to === to)?.token ?? ''
    );
  }

  /** Registers, verifies the email and returns a bearer token. */
  async signUp(email: string, name: string): Promise<string> {
    const password = `${name.split(' ')[0]} colis vers Oran 2026`
      .toLowerCase()
      .replace(/^\w+/, 'mon');
    const response = await this.call('POST', '/auth/register', {
      body: { email, password, name, locale: 'fr' },
    });
    await this.call('POST', '/auth/verify-email', {
      body: { token: this.lastToken('verify_email', email) },
    });
    return String((response.json() as Json)['accessToken']);
  }

  call(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    url: string,
    options: { token?: string; storeId?: string; body?: Json } = {},
  ) {
    this.requestCount += 1;
    const headers: Record<string, string> = { 'x-client-type': 'mobile' };
    if (options.token) headers['authorization'] = `Bearer ${options.token}`;
    if (options.storeId) headers['x-store-id'] = options.storeId;
    return this.app.inject({
      method,
      url,
      headers,
      remoteAddress: `10.1.${this.requestCount % 250}.${Math.floor(this.requestCount / 250) + 1}`,
      ...(options.body ? { payload: options.body } : {}),
    });
  }
}
