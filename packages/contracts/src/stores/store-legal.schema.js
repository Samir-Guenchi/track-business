import { z } from 'zod';
/**
 * How the seller is registered. A merchant or a company has a commercial register (RC) number;
 * an auto-entrepreneur (law 22-23) has a card number instead.
 */
export const LegalRegimeSchema = z.enum(['merchant', 'company', 'auto_entrepreneur']);
/** IFU sellers invoice without VAT; sellers under the real regime show VAT on the invoice. */
export const TaxRegimeSchema = z.enum(['ifu', 'real']);
const digits = (min, max) =>
  z
    .string()
    .transform((value) => value.replace(/\s/g, ''))
    .pipe(z.string().regex(new RegExp(`^\\d{${min},${max}}$`)));
const text = (max) => z.string().trim().min(2).max(max);
/** The legal identity printed on invoices (#140). Every field is optional until invoicing. */
export const StoreLegalProfileSchema = z.strictObject({
  regime: LegalRegimeSchema.nullable(),
  taxRegime: TaxRegimeSchema.nullable(),
  legalName: text(120).nullable(),
  address: text(240).nullable(),
  /** Numéro d'identification fiscale. */
  nif: digits(15, 20).nullable(),
  /** Numéro d'identification statistique (ONS). */
  nis: digits(15, 15).nullable(),
  /** Registre de commerce, as printed on the extract (`16/00-1234567 B 21`). */
  rcNumber: z
    .string()
    .trim()
    .regex(/^[0-9A-Za-z /-]{5,30}$/)
    .nullable(),
  autoEntrepreneurCard: z
    .string()
    .trim()
    .regex(/^[0-9A-Za-z /-]{5,30}$/)
    .nullable(),
  articleImposition: digits(8, 15).nullable(),
  updatedAt: z.iso.datetime().nullable(),
});
/** Only the fields sent change; null clears one. */
export const UpdateStoreLegalProfileRequestSchema = StoreLegalProfileSchema.omit({
  updatedAt: true,
})
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'Send at least one field' });
const ALWAYS = ['regime', 'taxRegime', 'legalName', 'address', 'nif'];
/** Fields still missing before the store can issue an invoice; empty means ready. */
export function missingForInvoice(profile) {
  const registration = profile.regime === 'auto_entrepreneur' ? 'autoEntrepreneurCard' : 'rcNumber';
  return [...ALWAYS, registration].filter((field) => profile[field] === null);
}
export const STORE_LEGAL_EVENTS = {
  legalUpdated: 'identity.store.legal-updated.v1',
};
/** The whole legal profile, so orders can keep the copy it prints on invoices. */
export const StoreLegalUpdatedEventSchema = StoreLegalProfileSchema.extend({
  storeId: z.string().min(1),
});
