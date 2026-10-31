import type { Locale } from '@trackecom/contracts';
import type { LockoutState } from '../../domain/login-lockout.js';
import type { User } from '../../domain/user.js';

export interface NewUser {
  readonly email: string;
  readonly passwordHash: string;
  readonly name: string;
  readonly phone: string | null;
  readonly locale: Locale;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  /** Throws EmailAlreadyRegisteredError on a duplicate email. */
  create(user: NewUser): Promise<User>;
  saveLockout(userId: string, state: LockoutState): Promise<void>;
  markEmailVerified(userId: string, at: Date): Promise<void>;
  /** Also revokes every refresh token of the user (all devices are signed out). */
  changePassword(userId: string, passwordHash: string): Promise<void>;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(hash: string, password: string): Promise<boolean>;
}

export interface IssuedAccessToken {
  readonly token: string;
  readonly expiresAt: Date;
}

export interface AccessTokenIssuer {
  issue(userId: string): Promise<IssuedAccessToken>;
}

export interface RefreshTokenStore {
  /** Starts a new family (a new login) and returns the raw token. */
  start(userId: string): Promise<string>;
  /** Rotates a token. Reuse of an already rotated token revokes its family and throws. */
  rotate(rawToken: string): Promise<{ userId: string; token: string }>;
  revoke(rawToken: string): Promise<void>;
}

export type OneTimePurpose = 'email_verification' | 'password_reset';

export interface OneTimeTokenStore {
  create(userId: string, purpose: OneTimePurpose): Promise<string>;
  /** The token's user if it is still usable, without using it up. */
  peek(rawToken: string, purpose: OneTimePurpose): Promise<string | null>;
  /** Marks the token used and returns its user, or null if unknown, used or expired. */
  consume(rawToken: string, purpose: OneTimePurpose): Promise<string | null>;
}

export type AuthEmail =
  | {
      readonly kind: 'verify_email';
      readonly to: string;
      readonly locale: Locale;
      readonly token: string;
    }
  | {
      readonly kind: 'reset_password';
      readonly to: string;
      readonly locale: Locale;
      readonly token: string;
    };

export interface AuthMailer {
  send(email: AuthEmail): Promise<void>;
}

export const AUTH_PORTS = {
  users: Symbol('UserRepository'),
  hasher: Symbol('PasswordHasher'),
  accessTokens: Symbol('AccessTokenIssuer'),
  refreshTokens: Symbol('RefreshTokenStore'),
  oneTimeTokens: Symbol('OneTimeTokenStore'),
  mailer: Symbol('AuthMailer'),
  clock: Symbol('Clock'),
} as const;

export type Clock = () => Date;
