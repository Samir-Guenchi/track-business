import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { ApiError } from '@trackecom/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { type ErrorReporter, NOOP_ERROR_REPORTER } from '../observability/error-reporter.js';
import { DomainError, type DomainErrorKind } from './domain-error.js';

const STATUS_BY_KIND: Record<DomainErrorKind, number> = {
  invalid: 400,
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
};

interface MappedError {
  readonly status: number;
  readonly body: ApiError;
}

function fromHttpException(exception: HttpException): MappedError {
  const status = exception.getStatus();
  const code = status === 404 ? 'not_found' : `http_${status}`;
  return { status, body: { error: { code, message: exception.message } } };
}

function fromDomainError(error: DomainError): MappedError {
  const body: ApiError = { error: { code: error.code, message: error.message } };
  if (error.details !== undefined) body.error.details = error.details;
  return { status: STATUS_BY_KIND[error.kind], body };
}

/** Fastify plugins (rate limit, body limit, bad JSON) throw errors carrying a 4xx `statusCode`. */
function clientErrorStatus(exception: unknown): number | undefined {
  if (!(exception instanceof Error) || !('statusCode' in exception)) return undefined;
  const status = exception.statusCode;
  return typeof status === 'number' && status >= 400 && status < 500 ? status : undefined;
}

function fromClientError(status: number, exception: Error): MappedError {
  const code = status === 429 ? 'rate_limited' : `http_${status}`;
  return { status, body: { error: { code, message: exception.message } } };
}

const INTERNAL: MappedError = {
  status: 500,
  body: { error: { code: 'internal', message: 'Something went wrong' } },
};

/** Turns every thrown error into `{ error: { code, message, details? } }`; never leaks stacks or SQL. */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  constructor(private readonly reporter: ErrorReporter = NOOP_ERROR_REPORTER) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const mapped = this.map(exception);
    const http = host.switchToHttp();
    if (mapped.status >= 500) {
      this.logger.error(exception);
      this.reporter.capture(exception, { correlationId: http.getRequest<FastifyRequest>().id });
    }
    void http.getResponse<FastifyReply>().status(mapped.status).send(mapped.body);
  }

  private map(exception: unknown): MappedError {
    if (exception instanceof DomainError) return fromDomainError(exception);
    if (exception instanceof HttpException) return fromHttpException(exception);
    const clientStatus = clientErrorStatus(exception);
    if (clientStatus !== undefined && exception instanceof Error)
      return fromClientError(clientStatus, exception);
    return INTERNAL;
  }
}
