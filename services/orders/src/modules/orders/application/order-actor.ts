import type { StoreContext } from '@trackecom/service-kit';

/** The verified caller plus the request's correlation id, passed to every use case. */
export interface OrderActor extends StoreContext {
  readonly correlationId: string;
}
