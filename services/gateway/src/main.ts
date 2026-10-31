import 'reflect-metadata';
import { loadEnv } from './config/env.schema.js';
import { createApp } from './create-app.js';

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const app = await createApp(env);
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
}

void bootstrap();
