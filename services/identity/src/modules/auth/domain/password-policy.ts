import { WeakPasswordError } from './auth.errors.js';

/** A short list of passwords Algerian sellers are likely to try; extend with a breach list later. */
const COMMON_PASSWORDS = new Set([
  '1234567890',
  '0123456789',
  'azertyuiop',
  'qwertyuiop',
  'motdepasse',
  'password12',
  'password123',
  'algerie213',
  'dz12345678',
  'trackecom1',
  '1111111111',
  '0000000000',
]);

/** Throws when a password is long enough by schema but still trivially guessable. */
export function assertStrongPassword(
  password: string,
  context: { email: string; name: string },
): void {
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) throw new WeakPasswordError('This password is too common');
  if (new Set(lower).size < 4) throw new WeakPasswordError('Use more different characters');
  const localPart = context.email.split('@')[0] ?? '';
  const personal = [localPart, context.name.toLowerCase().replace(/\s+/g, '')].filter(
    (v) => v.length >= 4,
  );
  if (personal.some((value) => lower.includes(value))) {
    throw new WeakPasswordError('Do not use your name or email in the password');
  }
}
