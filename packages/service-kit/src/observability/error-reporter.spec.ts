import type { ErrorEvent } from '@sentry/node';
import { describe, expect, it } from 'vitest';
import { NOOP_ERROR_REPORTER, initErrorReporting, scrubEvent } from './error-reporter.js';

describe('error reporting', () => {
  it('does nothing without a DSN', () => {
    const reporter = initErrorReporting({
      dsn: undefined,
      service: 'identity',
      environment: 'test',
      release: undefined,
    });

    expect(reporter).toBe(NOOP_ERROR_REPORTER);
  });

  it('removes headers, cookies, bodies, query strings and user data from events', () => {
    const event = {
      type: undefined,
      message: 'boom',
      user: { email: 'a@example.dz' },
      request: {
        url: '/auth/login',
        method: 'POST',
        headers: { authorization: 'Bearer x' },
        cookies: { te_refresh: 'y' },
        data: '{"password":"z"}',
        query_string: 'token=t',
      },
    } as unknown as ErrorEvent;

    const scrubbed = scrubEvent(event);

    expect(scrubbed).toEqual({
      type: undefined,
      message: 'boom',
      request: { url: '/auth/login', method: 'POST' },
    });
  });
});
