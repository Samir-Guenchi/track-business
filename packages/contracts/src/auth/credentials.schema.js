import { z } from 'zod';
import { AlgerianPhoneSchema } from '../common/phone.schema.js';
export const LocaleSchema = z.enum(['ar', 'fr', 'en']);
export const EmailSchema = z
  .email()
  .max(254)
  .transform((email) => email.toLowerCase());
/** Length beats complexity rules (NIST 800-63B); the server also rejects common passwords. */
export const PasswordSchema = z.string().min(10).max(128);
export const RegisterRequestSchema = z.strictObject({
  email: EmailSchema,
  password: PasswordSchema,
  name: z.string().trim().min(2).max(80),
  phone: AlgerianPhoneSchema.optional(),
  locale: LocaleSchema.default('ar'),
});
export const LoginRequestSchema = z.strictObject({
  email: EmailSchema,
  password: z.string().min(1).max(128),
});
export const VerifyEmailRequestSchema = z.strictObject({ token: z.string().min(20).max(200) });
export const ForgotPasswordRequestSchema = z.strictObject({ email: EmailSchema });
export const ResetPasswordRequestSchema = z.strictObject({
  token: z.string().min(20).max(200),
  password: PasswordSchema,
});
