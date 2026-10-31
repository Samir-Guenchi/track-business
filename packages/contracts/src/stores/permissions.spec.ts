import { describe, expect, it } from 'vitest';
import { PERMISSIONS, roleCan } from './permissions.js';

describe('permission matrix', () => {
  it('gives the owner every permission', () => {
    expect(PERMISSIONS.every((permission) => roleCan('owner', permission))).toBe(true);
  });

  it('keeps ownership transfer for the owner only', () => {
    expect(roleCan('manager', 'store.transfer')).toBe(false);
  });

  it('lets an accountant read money but not move it', () => {
    expect([roleCan('accountant', 'money.read'), roleCan('accountant', 'money.manage')]).toEqual([
      true,
      false,
    ]);
  });

  it('lets a confirmation agent confirm orders but not manage the team', () => {
    expect([roleCan('agent', 'orders.confirm'), roleCan('agent', 'members.manage')]).toEqual([
      true,
      false,
    ]);
  });
});
