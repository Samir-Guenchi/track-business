import type { Locale } from '@trackecom/contracts';
import type { LockoutState } from './login-lockout.js';

export interface User extends LockoutState {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly name: string;
  readonly phone: string | null;
  readonly locale: Locale;
  readonly emailVerifiedAt: Date | null;
}
