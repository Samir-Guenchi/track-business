import 'reflect-metadata';
import { createServiceApp, loadEnv } from '@trackecom/service-kit';
import { AppModule } from './app.module.js';
import { EnvSchema } from './config/env.schema.js';

async function bootstrap(): Promise<void> {
  const env = loadEnv(EnvSchema);
  const app = await createServiceApp({ module: AppModule.forRoot(env), env });
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
}

void bootstrap();
