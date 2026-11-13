import type { ApiError } from '@trackecom/contracts';

/** Thrown when the gateway answers with the shared error shape (or nothing usable). */
export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiError['error'],
  ) {
    super(body.message);
    this.name = 'ApiClientError';
  }

  get code(): string {
    return this.body.code;
  }
}
