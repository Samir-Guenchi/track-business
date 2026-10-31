import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS, type Permission, STORE_HEADER, roleCan } from '@trackecom/contracts';
import { ACCESS_POLICY_KEY, type AccessPolicy } from '@trackecom/service-kit';
import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AccessDeniedError, InvalidTokenError } from './access.errors.js';
import { IdentityClient } from './identity.client.js';
import type { StoreContext } from './store-context.js';
import { StoreRolesCache } from './store-roles.cache.js';

export const ACCESS_COOKIE = 'te_access';

export interface AuthorizedRequest extends FastifyRequest {
  storeContext?: StoreContext;
}

const StoreIdSchema = z.uuid();
const isPermission = (value: string): value is Permission =>
  (PERMISSIONS as readonly string[]).includes(value);

function tokenOf(request: FastifyRequest): string | undefined {
  const header = request.headers.authorization;
  return header?.startsWith('Bearer ')
    ? header.slice('Bearer '.length)
    : request.cookies[ACCESS_COOKIE];
}

/**
 * Global and deny by default, like identity's guard. Every orders route is a store route: the
 * store comes from `x-store-id` and the caller's role in it is checked on every request.
 */
@Injectable()
export class StoreAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly identity: IdentityClient,
    private readonly roles: StoreRolesCache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policy = this.reflector.getAllAndOverride<AccessPolicy | undefined>(ACCESS_POLICY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (policy?.kind === 'public') return true;
    if (policy?.kind !== 'permission' || !isPermission(policy.permission))
      throw new AccessDeniedError();
    const request = context.switchToHttp().getRequest<AuthorizedRequest>();
    const token = tokenOf(request);
    if (!token) throw new InvalidTokenError();
    const userId = await this.identity.verify(token);
    const storeId = StoreIdSchema.safeParse(request.headers[STORE_HEADER]);
    if (!storeId.success) throw new AccessDeniedError();
    const role = await this.roles.roleIn(storeId.data, userId, token);
    if (!role || !roleCan(role, policy.permission)) throw new AccessDeniedError();
    request.storeContext = { storeId: storeId.data, userId, role, ip: request.ip };
    return true;
  }
}
