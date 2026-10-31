import { describe, expect, it } from 'vitest';
import { assertCanAssign, assertCanRemove } from './role-rules.js';
import { RoleChangeNotAllowedError } from './stores.errors.js';

describe('role rules', () => {
  it('lets the owner make an agent a manager', () => {
    expect(() => assertCanAssign('owner', 'agent', 'manager')).not.toThrow();
  });

  it('lets a manager invite an agent', () => {
    expect(() => assertCanAssign('manager', null, 'agent')).not.toThrow();
  });

  it.each([
    ['manager', 'agent', 'manager'],
    ['manager', 'manager', 'agent'],
    ['owner', 'owner', 'manager'],
    ['owner', 'agent', 'owner'],
    ['agent', 'packer', 'accountant'],
  ] as const)('refuses %s changing %s into %s', (actor, current, next) => {
    expect(() => assertCanAssign(actor, current, next)).toThrow(RoleChangeNotAllowedError);
  });

  it('never removes the owner', () => {
    expect(() => assertCanRemove('owner', 'owner')).toThrow(RoleChangeNotAllowedError);
  });

  it('lets a manager remove a packer but not another manager', () => {
    expect(() => assertCanRemove('manager', 'packer')).not.toThrow();
    expect(() => assertCanRemove('manager', 'manager')).toThrow(RoleChangeNotAllowedError);
  });
});
