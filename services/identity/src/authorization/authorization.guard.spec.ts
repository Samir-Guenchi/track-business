import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import type { AccessTokenVerifier } from '../modules/auth/infrastructure/access-token.verifier.js';
import type { MembershipRepository } from '../modules/stores/application/ports/stores.ports.js';
import { AccessDeniedError } from '../modules/stores/domain/stores.errors.js';
import { AuthorizationGuard } from './authorization.guard.js';

const contextFor = (headers: Record<string, string> = {}) =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ headers, cookies: {}, ip: '127.0.0.1' }) }),
  }) as unknown as ExecutionContext;

const guardWith = (policy: unknown) =>
  new AuthorizationGuard(
    { getAllAndOverride: () => policy } as unknown as Reflector,
    { verify: async () => ({ userId: 'usr_1' }) } as unknown as AccessTokenVerifier,
    { find: async () => null } as unknown as MembershipRepository,
  );

describe('AuthorizationGuard', () => {
  it('denies a route that declares no access policy', async () => {
    await expect(guardWith(undefined).canActivate(contextFor())).rejects.toBeInstanceOf(
      AccessDeniedError,
    );
  });

  it('allows a public route without a token', async () => {
    await expect(guardWith({ kind: 'public' }).canActivate(contextFor())).resolves.toBe(true);
  });

  it('denies a store route for a non-member', async () => {
    const headers = {
      authorization: 'Bearer t',
      'x-store-id': '0195f0a0-0000-7000-8000-000000000001',
    };

    await expect(
      guardWith({ kind: 'permission', permission: 'orders.read' }).canActivate(contextFor(headers)),
    ).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it('denies an unknown permission name instead of allowing it', async () => {
    const headers = {
      authorization: 'Bearer t',
      'x-store-id': '0195f0a0-0000-7000-8000-000000000001',
    };

    await expect(
      guardWith({ kind: 'permission', permission: 'orders.reed' }).canActivate(contextFor(headers)),
    ).rejects.toBeInstanceOf(AccessDeniedError);
  });
});
