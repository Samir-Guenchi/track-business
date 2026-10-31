import type { StoreContext } from '../../../authorization/store-context.js';

/** The verified caller plus the request's correlation id, passed to every use case. */
export interface OrderActor extends StoreContext {
  readonly correlationId: string;
}
