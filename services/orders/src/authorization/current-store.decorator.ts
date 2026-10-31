import { type ExecutionContext, createParamDecorator } from '@nestjs/common';
import { AccessDeniedError } from './access.errors.js';
import type { AuthorizedRequest } from './store-access.guard.js';
import type { StoreContext } from './store-context.js';

/** The verified store context set by StoreAccessGuard. */
export const CurrentStore = createParamDecorator(
  (_data: unknown, context: ExecutionContext): StoreContext => {
    const store = context.switchToHttp().getRequest<AuthorizedRequest>().storeContext;
    if (!store) throw new AccessDeniedError();
    return store;
  },
);
