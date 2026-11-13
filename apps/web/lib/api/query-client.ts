import { QueryClient } from '@tanstack/react-query';
import { ApiClientError } from './api-client-error';

const NO_RETRY_STATUSES: ReadonlySet<number> = new Set([400, 401, 403, 404, 409, 422]);

/** Retry only what can succeed later: network errors and 5xx, at most twice. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiClientError && NO_RETRY_STATUSES.has(error.status)) return false;
  return failureCount < 2;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: shouldRetry, refetchOnWindowFocus: false },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * One client per server request, but one per browser tab: the seller app, the auth pages and
 * onboarding have separate layouts and must share the session cache when moving between them.
 */
export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') return createQueryClient();
  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
}
