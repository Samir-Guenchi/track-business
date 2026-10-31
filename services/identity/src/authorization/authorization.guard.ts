import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS, type Permission, STORE_HEADER, roleCan } from '@trackecom/contracts';
import { ACCESS_POLICY_KEY, type AccessPolicy } from '@trackecom/service-kit';
import { z } from 'zod';
import { InvalidTokenError } from '../modules/auth/domain/auth.errors.js';
import { AccessTokenVerifier } from '../modules/auth/infrastructure/access-token.verifier.js';
import { ACCESS_COOKIE } from '../modules/auth/interface/session-cookies.js';
import {
  type MembershipRepository,
  STORES_PORTS,
} from '../modules/stores/application/ports/stores.ports.js';
import { AccessDeniedError } from '../modules/stores/domain/stores.errors.js';
import type { AuthorizedRequest } from './request-context.js';

const StoreIdSchema = z.uuid();
const isPermission = (value: string): value is Permission =>
  (PERMISSIONS as readonly string[]).includes(value);

function bearerToken(request: AuthorizedRequest): string | undefined {
  const header = request.headers.authorization;
  return header?.startsWith('Bearer ')
    ? header.slice('Bearer '.length)
    : request.cookies[ACCESS_COOKIE];
}

/**
 * Global, deny by default: a route without @Public, @Authenticated or @RequirePermission is
 * refused. For store routes the store comes from `x-store-id`, and membership + role are
 * checked here on every request, so controllers never trust a store id from the client.
 */
@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly verifier: AccessTokenVerifier,
    @Inject(STORES_PORTS.memberships) private readonly memberships: MembershipRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policy = this.reflector.getAllAndOverride<AccessPolicy | undefined>(ACCESS_POLICY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!policy) throw new AccessDeniedError();
    if (policy.kind === 'public') return true;
    const request = context.switchToHttp().getRequest<AuthorizedRequest>();
    const token = bearerToken(request);
    if (!token) throw new InvalidTokenError();
    request.userId = (await this.verifier.verify(token)).userId;
    if (policy.kind === 'permission')
      await this.authorizeStore(request, request.userId, policy.permission);
    return true;
  }

  private async authorizeStore(
    request: AuthorizedRequest,
    userId: string,
    permission: string,
  ): Promise<void> {
    const storeId = StoreIdSchema.safeParse(request.headers[STORE_HEADER]);
    if (!storeId.success || !isPermission(permission)) throw new AccessDeniedError();
    const membership = await this.memberships.find(storeId.data, userId);
    if (!membership || !roleCan(membership.role, permission)) throw new AccessDeniedError();
    request.storeContext = { storeId: storeId.data, userId, role: membership.role, ip: request.ip };
  }
}
