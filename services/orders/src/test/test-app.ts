import 'reflect-metadata';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createServiceApp, loadEnv } from '@trackecom/service-kit';
import { AppModule } from '../app.module.js';
import { type Env, EnvSchema } from '../config/env.schema.js';

/** Unreachable on purpose: unit/API tests must not depend on a running database. */
export const OFFLINE_ENV = {
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  DATABASE_URL: 'postgresql://nobody:nobody@127.0.0.1:1/none',
  REDIS_URL: 'redis://127.0.0.1:1',
  IDENTITY_URL: 'http://127.0.0.1:1',
};

export function testEnv(overrides: Record<string, string | undefined> = {}): Env {
  return loadEnv(EnvSchema, { ...OFFLINE_ENV, ...overrides });
}

/** Boots the real app (same bootstrap as main.ts) for `app.inject()` tests. */
export async function startTestApp(env: Env = testEnv()): Promise<NestFastifyApplication> {
  const app = await createServiceApp({ module: AppModule.forRoot(env), env });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}
