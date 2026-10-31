import { DomainError } from '@trackecom/service-kit';

/** Not a member, or the role lacks the permission. One error so store ids cannot be probed. */
export class AccessDeniedError extends DomainError {
  readonly code = 'auth.forbidden';
  readonly kind = 'forbidden';

  constructor() {
    super('You do not have access to this action in this store');
  }
}

export class MemberNotFoundError extends DomainError {
  readonly code = 'stores.member_not_found';
  readonly kind = 'not_found';

  constructor() {
    super('No such member in this store');
  }
}

export class RoleChangeNotAllowedError extends DomainError {
  readonly code = 'stores.role_change_not_allowed';
  readonly kind = 'forbidden';
}

export class InvitationInvalidError extends DomainError {
  readonly code = 'stores.invitation_invalid';
  readonly kind = 'not_found';

  constructor() {
    super('This invitation is invalid, used or expired');
  }
}

export class AlreadyMemberError extends DomainError {
  readonly code = 'stores.already_member';
  readonly kind = 'conflict';

  constructor() {
    super('You are already a member of this store');
  }
}
