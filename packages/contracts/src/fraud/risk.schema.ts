import { z } from 'zod';
import { CursorQuerySchema, cursorPage } from '../common/pagination.schema.js';
import { AlgerianPhoneSchema } from '../common/phone.schema.js';

/**
 * Why an order looks fake or risky (#52), checked when it is created, before the agent queue.
 * A flag never blocks an order: the agent sees it and decides.
 */
export const RISK_FLAGS = [
  /** The phone, or the name in that commune, is on the store's blacklist. */
  'blacklisted',
  /** A number no real customer has: one digit repeated, or a run such as 0555 123456. */
  'suspicious_phone',
  /** The same phone placed several orders within minutes. */
  'order_burst',
  /** A name with no vowel, keyboard mashing or digits. */
  'gibberish_name',
] as const;
export const RiskFlagSchema = z.enum(RISK_FLAGS);
export type RiskFlag = z.infer<typeof RiskFlagSchema>;

export const BLACKLIST_REASONS = ['refused_parcel', 'fake_order', 'abusive', 'other'] as const;
export const BlacklistReasonSchema = z.enum(BLACKLIST_REASONS);

const Name = z.string().trim().min(2).max(80);

/** `POST /blacklist`: a phone, or a name in one commune (customers change numbers). */
export const CreateBlacklistEntryRequestSchema = z
  .strictObject({
    phone: AlgerianPhoneSchema.optional(),
    name: Name.optional(),
    communeId: z.number().int().positive().optional(),
    reason: BlacklistReasonSchema,
    note: z.string().trim().max(300).optional(),
    /** Entries expire so a number that changed hands is not blocked forever; null keeps it. */
    expiresAt: z.iso.datetime().nullable().default(null),
  })
  .refine((entry) => Boolean(entry.phone) || Boolean(entry.name && entry.communeId), {
    message: 'Give a phone, or a name with its commune',
    path: ['phone'],
  });
export type CreateBlacklistEntryRequest = z.input<typeof CreateBlacklistEntryRequestSchema>;

export const BlacklistEntrySchema = z.strictObject({
  id: z.uuid(),
  phone: z.string().nullable(),
  name: z.string().nullable(),
  communeId: z.number().int().nullable(),
  reason: BlacklistReasonSchema,
  note: z.string().nullable(),
  expiresAt: z.iso.datetime().nullable(),
  createdBy: z.string(),
  createdAt: z.iso.datetime(),
});
export type BlacklistEntry = z.infer<typeof BlacklistEntrySchema>;

export const ListBlacklistQuerySchema = CursorQuerySchema.extend({
  cursor: z.uuid().optional(),
  /** Finds an entry by phone in any spelling. */
  phone: AlgerianPhoneSchema.optional(),
});
export type ListBlacklistQuery = z.infer<typeof ListBlacklistQuerySchema>;

export const ListBlacklistResponseSchema = cursorPage(BlacklistEntrySchema);
export type ListBlacklistResponse = z.infer<typeof ListBlacklistResponseSchema>;
