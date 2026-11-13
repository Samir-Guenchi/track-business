import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createServiceApp } from '@trackecom/service-kit';
import { AppModule, SERVICE_NAME } from './app.module.js';
import type { Env } from './config/env.schema.js';
import { registerRoutes } from './routing/register-routes.js';
import { upstreamsFrom } from './routing/upstreams.js';

/** The gateway as `main.ts` runs it and as the tests exercise it. */
export async function createGatewayApp(env: Env): Promise<NestFastifyApplication> {
  const app = await createServiceApp({
    module: AppModule.forRoot(env),
    env,
    service: SERVICE_NAME,
  });
  await registerRoutes(app.getHttpAdapter().getInstance(), upstreamsFrom(env));
  return app;
}
