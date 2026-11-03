import { z } from 'zod';
import { LocaleSchema } from '../auth/credentials.schema.js';
import { AlgerianPhoneSchema } from '../common/phone.schema.js';
import { WilayaCodeSchema } from '../geo/wilaya.schema.js';
/** Orders per day, in buckets: enough to size advice, not a figure to audit. */
export const DailyVolumeSchema = z.enum(['under_10', '10_50', '50_200', 'over_200']);
/** A carrier code as the carriers package names it (`yalidine`, `zr-express`...). */
const CarrierCode = z.string().regex(/^[a-z0-9-]{2,40}$/);
/** What the onboarding and the settings ask about a store (#160). */
export const StoreProfileSchema = z.strictObject({
  /** Where parcels leave from: shipping prices start from this wilaya. */
  originWilayaCode: WilayaCodeSchema.nullable(),
  originCommuneId: z.number().int().positive().nullable(),
  contactPhone: AlgerianPhoneSchema.nullable(),
  /** Set by the logo upload, never by the client directly. */
  logoUrl: z.url().nullable(),
  dailyVolume: DailyVolumeSchema.nullable(),
  /** Carriers the store already works with. */
  carriers: z.array(CarrierCode).max(10),
  /** Language of customer messages and the tracking page. */
  defaultLanguage: LocaleSchema,
  updatedAt: z.iso.datetime().nullable(),
});
/** Only the fields sent change; null clears one. */
export const UpdateStoreProfileRequestSchema = z
  .strictObject({
    originWilayaCode: WilayaCodeSchema.nullable(),
    originCommuneId: z.number().int().positive().nullable(),
    contactPhone: AlgerianPhoneSchema.nullable(),
    dailyVolume: DailyVolumeSchema.nullable(),
    carriers: z.array(CarrierCode).max(10),
    defaultLanguage: LocaleSchema,
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'Send at least one field' })
  .refine((body) => body.originCommuneId == null || body.originWilayaCode != null, {
    message: 'A commune needs its wilaya',
    path: ['originCommuneId'],
  });
export const STORE_EVENTS = {
  profileUpdated: 'identity.store.profile-updated.v1',
};
/** Shipping takes the origin wilaya for prices; the tracking page the logo and language. */
export const StoreProfileUpdatedEventSchema = z.strictObject({
  storeId: z.string().min(1),
  originWilayaCode: WilayaCodeSchema.nullable(),
  originCommuneId: z.number().int().positive().nullable(),
  logoUrl: z.url().nullable(),
  defaultLanguage: LocaleSchema,
});
