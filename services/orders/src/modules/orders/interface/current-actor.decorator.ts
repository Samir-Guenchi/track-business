import { type ExecutionContext, createParamDecorator } from '@nestjs/common';
import { AccessDeniedError } from '../../../authorization/access.errors.js';
import type { AuthorizedRequest } from '../../../authorization/store-access.guard.js';
import type { OrderActor } from '../application/order-actor.js';

/** The verified store context plus the request's correlation id (also on events and logs). */
export const CurrentActor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): OrderActor => {
    const request = context.switchToHttp().getRequest<AuthorizedRequest>();
    if (!request.storeContext) throw new AccessDeniedError();
    return { ...request.storeContext, correlationId: String(request.id) };
  },
);
