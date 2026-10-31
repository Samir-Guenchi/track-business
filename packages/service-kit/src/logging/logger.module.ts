import { type DynamicModule, RequestMethod } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

/** Never log credentials or personal data (secure-coding skill, law 18-07). */
export const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  '*.password',
  '*.token',
  '*.refreshToken',
  '*.phone',
  '*.email',
];

export interface LoggingOptions {
  readonly service: string;
  readonly level: string;
}

/** Structured JSON logs with `service` and a correlation id propagated from the gateway. */
export function loggingModule(options: LoggingOptions): DynamicModule {
  return LoggerModule.forRoot({
    // nestjs-pino's default route pattern does not match under the Fastify adapter of Nest 12.
    forRoutes: [{ path: '*path', method: RequestMethod.ALL }],
    pinoHttp: {
      level: options.level,
      base: { service: options.service },
      redact: { paths: REDACTED_PATHS, censor: '[redacted]' },
      // `req.id` is the correlation id Fastify assigned (see create-service-app.ts).
      customProps: (req) => ({ correlationId: req.id }),
      autoLogging: { ignore: (req) => req.url?.startsWith('/health') ?? false },
    },
  });
}
