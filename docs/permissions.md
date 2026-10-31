# Roles and permissions

Source of truth: `packages/contracts/src/stores/permissions.ts` (`ROLE_PERMISSIONS`). Services, the web app and the mobile app import it from there. This table must match it; change both in the same PR.

| Permission | Owner | Manager | Confirmation agent | Warehouse / packer | Accountant |
|---|:-:|:-:|:-:|:-:|:-:|
| `store.read` view store profile | ✓ | ✓ | ✓ | ✓ | ✓ |
| `store.update` edit store profile | ✓ | ✓ | | | |
| `store.transfer` transfer ownership | ✓ | | | | |
| `members.read` see the team | ✓ | ✓ | | | |
| `members.manage` invite, change roles, remove | ✓ | ✓ ¹ | | | |
| `orders.read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `orders.write` create and edit orders | ✓ | ✓ | | | |
| `orders.confirm` call outcomes, confirm, cancel | ✓ | ✓ | ✓ | | |
| `shipments.manage` labels, manifests, hand-over | ✓ | ✓ | | ✓ | |
| `money.read` COD, wallet, statements | ✓ | ✓ | | | ✓ |
| `money.manage` adjustments, payouts | ✓ | ✓ | | | |
| `audit.read` activity history | ✓ | ✓ | | | ✓ |

¹ A manager manages only roles below their own (agent, packer, accountant). Only the owner creates managers. The owner role changes only through a transfer; the previous owner stays as a manager.

## How it is enforced

- **Deny by default.** identity installs a global guard: a route without `@Public()`, `@Authenticated()` or `@RequirePermission('<permission>')` (from `@trackecom/service-kit`) is refused.
- **Store selection.** Clients send the store in the `x-store-id` header. The guard verifies the access token, loads the membership for that user and store, checks the permission and only then exposes `StoreContext` to the controller. A store id from a body, query or path is never trusted.
- **Same answer for "not a member" and "not allowed"** (`403 auth.forbidden`), so store ids cannot be probed.
- **Every query is scoped by `storeId`**, including loads by id (`findFirst({ where: { id, storeId } })`), so an id from another store is "not found" (IDOR).
- **Audit.** Store creation, invitations (created, accepted, revoked), role changes, removals and ownership transfers write an audit event in the same transaction (`GET /audit?entity=membership&id=...`, needs `audit.read`).
- **Isolation tests.** `services/identity/src/modules/stores/stores.int.spec.ts` proves store A's owner cannot read or change store B's data. Every new module adds the same kind of test.

Other services verify the access token with identity's JWKS and get the role from a membership read model fed by events (follow-up with #22); until then they call identity.
