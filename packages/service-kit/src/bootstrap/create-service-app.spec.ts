import 'reflect-metadata';
import { Body, Controller, Get, Module, Post } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ApiErrorSchema, HealthStatusSchema } from '@trackecom/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { BaseEnvSchema } from '../config/base-env.schema.js';
import { loadEnv } from '../config/load-env.js';
import { DomainError } from '../errors/domain-error.js';
import { HealthModule } from '../health/health.module.js';
import { loggingModule } from '../logging/logger.module.js';
import { ZodValidationPipe } from '../validation/zod-validation.pipe.js';
import { createServiceApp } from './create-service-app.js';

class ParcelLostError extends DomainError {
  readonly code = 'shipping.parcel_lost';
  readonly kind = 'not_found';
}

const EchoSchema = z.strictObject({ name: z.string().min(1) });

@Controller('probe')
class ProbeController {
  @Get('domain-error')
  domainError(): never {
    throw new ParcelLostError('Parcel not found');
  }

  @Get('crash')
  crash(): never {
    throw new Error('connect ECONNREFUSED 10.0.0.5:5432');
  }

  @Post('echo')
  echo(
    @Body(new ZodValidationPipe(EchoSchema)) body: z.infer<typeof EchoSchema>,
  ): z.infer<typeof EchoSchema> {
    return body;
  }
}

@Module({
  imports: [
    loggingModule({ service: 'probe', level: 'silent' }),
    HealthModule.forRoot({
      service: 'probe',
      useFactory: () => [{ name: 'database', isHealthy: async () => false }],
    }),
  ],
  controllers: [ProbeController],
})
class ProbeModule {}

describe('createServiceApp', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const env = loadEnv(BaseEnvSchema, { NODE_ENV: 'test', PORT: '4999' });
    app = await createServiceApp({ module: ProbeModule, env });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('maps a domain error to its status and stable code', async () => {
    const response = await app.inject({ method: 'GET', url: '/probe/domain-error' });

    expect(response.statusCode).toBe(404);
    expect(ApiErrorSchema.parse(response.json()).error.code).toBe('shipping.parcel_lost');
  });

  it('hides internal details of unexpected errors', async () => {
    const response = await app.inject({ method: 'GET', url: '/probe/crash' });

    expect(response.statusCode).toBe(500);
    expect(response.body).not.toContain('10.0.0.5');
  });

  it('rejects unknown fields with field paths and no values', async () => {
    const payload = { name: 'Amina', storeId: 'store_b' };

    const response = await app.inject({ method: 'POST', url: '/probe/echo', payload });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('validation_failed');
    expect(response.body).not.toContain('store_b');
  });

  it('reports not ready with 503 when a dependency is down', async () => {
    const response = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(503);
  });

  it('is live even when a dependency is down', async () => {
    const response = await app.inject({ method: 'GET', url: '/health/live' });

    expect(HealthStatusSchema.parse(response.json()).status).toBe('ok');
  });

  it('echoes a sane correlation id and sends security headers', async () => {
    const headers = { 'x-correlation-id': 'corr-12345678' };

    const response = await app.inject({ method: 'GET', url: '/probe/domain-error', headers });

    expect(response.headers['x-correlation-id']).toBe('corr-12345678');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });
});
