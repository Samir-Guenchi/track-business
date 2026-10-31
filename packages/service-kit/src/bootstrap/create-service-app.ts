import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { DynamicModule, Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import type { BaseEnv } from '../config/base-env.schema.js';
import { ApiExceptionFilter } from '../errors/api-exception.filter.js';
import { CORRELATION_HEADER, correlationIdOf } from '../logging/correlation-id.js';
import { initErrorReporting } from '../observability/error-reporter.js';

const BODY_LIMIT_BYTES = 1_048_576;

export interface ServiceAppOptions {
  readonly module: Type<unknown> | DynamicModule;
  readonly env: BaseEnv;
  /** Tags error reports; defaults to `service`. */
  readonly service?: string;
}

/**
 * Builds a NestJS + Fastify app with the defaults every service shares: body limit, helmet, cookies,
 * CORS allowlist, rate limit, JSON logs, one error format, graceful shutdown.
 * Shared by `main.ts` and the HTTP tests so tests exercise the real setup.
 */
export async function createServiceApp(
  options: ServiceAppOptions,
): Promise<NestFastifyApplication> {
  const { env } = options;
  const adapter = new FastifyAdapter({
    bodyLimit: BODY_LIMIT_BYTES,
    trustProxy: true,
    genReqId: correlationIdOf,
  });
  adapter.getInstance().addHook('onSend', async (request, reply) => {
    void reply.header(CORRELATION_HEADER, request.id);
  });
  const app = await NestFactory.create<NestFastifyApplication>(options.module, adapter, {
    bufferLogs: true,
    // Kept next to the parsed body so webhook receivers can check signatures over exact bytes.
    rawBody: true,
  });
  app.useLogger(app.get(Logger));
  await app.register(helmet);
  await app.register(cookie);
  await app.register(rateLimit, { max: env.RATE_LIMIT_PER_MINUTE, timeWindow: '1 minute' });
  app.enableCors({ origin: env.CORS_ORIGINS, credentials: true });
  const reporter = initErrorReporting({
    dsn: env.SENTRY_DSN,
    service: options.service ?? 'service',
    environment: env.DEPLOY_ENV,
    release: env.RELEASE,
  });
  app.useGlobalFilters(new ApiExceptionFilter(reporter));
  app.enableShutdownHooks();
  return app;
}
