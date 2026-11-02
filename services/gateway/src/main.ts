import 'reflect-metadata';
import { loadEnv } from '@trackecom/service-kit';
import { EnvSchema } from './config/env.schema.js';
import { createGatewayApp } from './create-gateway-app.js';

async function bootstrap(): Promise<void> {
  const env = loadEnv(EnvSchema);
  const app = await createGatewayApp(env);
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
}

void bootstrap();
