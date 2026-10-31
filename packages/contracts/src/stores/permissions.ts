import { z } from 'zod';

export const StoreRoleSchema = z.enum(['owner', 'manager', 'agent', 'packer', 'accountant']);
export type StoreRole = z.infer<typeof StoreRoleSchema>;

export const PERMISSIONS = [
  'store.read',
  'store.update',
  'store.transfer',
  'members.read',
  'members.manage',
  'orders.read',
  'orders.write',
  'orders.confirm',
  'shipments.manage',
  'money.read',
  'money.manage',
  'audit.read',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL: readonly Permission[] = PERMISSIONS;

/**
 * The permission matrix (documented in docs/permissions.md). Services and the web app read it
 * from here so a role means the same thing everywhere. Change it only through a reviewed PR.
 */
export const ROLE_PERMISSIONS: Readonly<Record<StoreRole, readonly Permission[]>> = {
  owner: ALL,
  manager: ALL.filter((permission) => permission !== 'store.transfer'),
  agent: ['store.read', 'orders.read', 'orders.confirm'],
  packer: ['store.read', 'orders.read', 'shipments.manage'],
  accountant: ['store.read', 'orders.read', 'money.read', 'audit.read'],
};

export function roleCan(role: StoreRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
