import { z } from 'zod';

const LOCAL_MOBILE = /^0([567]\d{8})$/;
const INTERNATIONAL_MOBILE = /^(?:\+|00)213([567]\d{8})$/;

/**
 * Algerian mobile number in any common spelling (`0551 23 45 67`, `+213551234567`,
 * `00213 551...`), normalised to E.164 (`+213551234567`).
 */
export const AlgerianPhoneSchema = z
  .string()
  .transform((value) => value.replace(/[\s.-]/g, ''))
  .transform((value, ctx) => {
    const digits = LOCAL_MOBILE.exec(value)?.[1] ?? INTERNATIONAL_MOBILE.exec(value)?.[1];
    if (!digits) {
      ctx.addIssue({
        code: 'custom',
        message: 'Expected an Algerian mobile number (05, 06 or 07)',
      });
      return z.NEVER;
    }
    return `+213${digits}`;
  });

export type AlgerianPhone = z.output<typeof AlgerianPhoneSchema>;
