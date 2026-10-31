import * as Sentry from '@sentry/node';

/** Where unexpected (5xx) errors go besides the logs. */
export interface ErrorReporter {
  capture(error: unknown, context: { readonly correlationId: string }): void;
}

export const NOOP_ERROR_REPORTER: ErrorReporter = { capture: () => undefined };

export interface ErrorReportingOptions {
  readonly dsn: string | undefined;
  readonly service: string;
  readonly environment: string;
  readonly release: string | undefined;
}

/** Keeps only an allowlist, so nothing holding personal data or secrets leaves the process. */
export function scrubEvent<T extends Sentry.ErrorEvent>(event: T): T {
  const scrubbed: T = { ...event };
  delete scrubbed.user;
  if (event.request) {
    const { url, method } = event.request;
    scrubbed.request = { ...(url ? { url } : {}), ...(method ? { method } : {}) };
  }
  return scrubbed;
}

/** Sentry when SENTRY_DSN is set (staging, production), otherwise nothing. */
export function initErrorReporting(options: ErrorReportingOptions): ErrorReporter {
  if (!options.dsn) return NOOP_ERROR_REPORTER;
  Sentry.init({
    dsn: options.dsn,
    environment: options.environment,
    ...(options.release ? { release: options.release } : {}),
    initialScope: { tags: { service: options.service } },
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
    tracesSampleRate: 0,
    beforeSend: scrubEvent,
  });
  return {
    capture: (error, context) => {
      Sentry.captureException(error, { tags: { correlationId: context.correlationId } });
    },
  };
}
