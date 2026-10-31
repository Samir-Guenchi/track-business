import type { StoreRole } from '@trackecom/contracts';
import { RoleChangeNotAllowedError } from './stores.errors.js';

/** Higher rank manages lower rank. The owner is changed only by a transfer. */
const RANK: Record<StoreRole, number> = {
  owner: 3,
  manager: 2,
  agent: 1,
  packer: 1,
  accountant: 1,
};

/** Can `actor` give `newRole` to a member who currently has `currentRole` (or invite them)? */
export function assertCanAssign(
  actor: StoreRole,
  currentRole: StoreRole | null,
  newRole: StoreRole,
): void {
  if (newRole === 'owner' || currentRole === 'owner') {
    throw new RoleChangeNotAllowedError('Ownership changes only through a transfer');
  }
  const outranksTarget = currentRole === null || RANK[actor] > RANK[currentRole];
  if (!outranksTarget || RANK[actor] <= RANK[newRole]) {
    throw new RoleChangeNotAllowedError('You can only manage roles below your own');
  }
}

/** Can `actor` remove a member with `targetRole`? */
export function assertCanRemove(actor: StoreRole, targetRole: StoreRole): void {
  if (targetRole === 'owner' || RANK[actor] <= RANK[targetRole]) {
    throw new RoleChangeNotAllowedError('You can only remove members below your own role');
  }
}
