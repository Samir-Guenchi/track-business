import { z } from 'zod';
import { AlgerianPhoneSchema } from '../common/phone.schema.js';
import { GeoPointSchema, LandmarkSchema, LocationPinSchema } from './location.schema.js';
/** The buyer as the seller typed it. Wilaya and commune are codes from the geo reference data. */
export const CustomerInputSchema = z.strictObject({
  name: z.string().trim().min(2).max(80),
  phone: AlgerianPhoneSchema,
  phone2: AlgerianPhoneSchema.optional(),
  wilayaCode: z.number().int().min(1).max(99),
  communeId: z.number().int().positive(),
  /** Required for home delivery, ignored for stop-desk delivery. */
  address: z.string().trim().max(255).optional(),
  landmark: LandmarkSchema.optional(),
  /** A pin the agent drops during the call; left out, an existing pin is kept. */
  location: GeoPointSchema.optional(),
});
export const CustomerSchema = z.strictObject({
  name: z.string(),
  phone: z.string(),
  phone2: z.string().nullable(),
  wilayaCode: z.number().int(),
  communeId: z.number().int(),
  address: z.string().nullable(),
  landmark: z.string().nullable(),
  location: LocationPinSchema.nullable(),
});
