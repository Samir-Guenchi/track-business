import { type ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { InvalidTokenError } from '../modules/auth/domain/auth.errors.js';
import type { StoreContext } from '../modules/stores/domain/store-context.js';
import { AccessDeniedError } from '../modules/stores/domain/stores.errors.js';

/** Filled only by AuthorizationGuard, after the token and the membership are verified. */
export interface AuthorizedRequest extends FastifyRequest {
  userId?: string;
  storeContext?: StoreContext;
}

const requestOf = (context: ExecutionContext) =>
  context.switchToHttp().getRequest<AuthorizedRequest>();

export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const userId = requestOf(context).userId;
    if (!userId) throw new InvalidTokenError();
    return userId;
  },
);

export const CurrentStore = createParamDecorator(
  (_data: unknown, context: ExecutionContext): StoreContext => {
    const store = requestOf(context).storeContext;
    if (!store) throw new AccessDeniedError();
    return store;
  },
);

export const ClientIp = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => requestOf(context).ip,
);
