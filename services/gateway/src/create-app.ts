import helmet from '@fastify/helmet';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';
import type { Env } from './config/env.schema.js';

const BODY_LIMIT_BYTES = 1_048_576;

/** Builds the app with security defaults; shared by main.ts and the tests. */
export async function createApp(env: Env): Promise<NestFastifyApplication> {
  const adapter = new FastifyAdapter({ bodyLimit: BODY_LIMIT_BYTES, trustProxy: true });
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    logger: env.NODE_ENV === 'test' ? false : ['error', 'warn', 'log'],
  });
  await app.register(helmet);
  app.enableCors({ origin: env.CORS_ORIGINS, credentials: true });
  app.enableShutdownHooks();
  return app;
}
