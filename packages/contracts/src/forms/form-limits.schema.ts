import { z } from 'zod';
import { FORM_LIMITS } from './form-submission.schema.js';

/** The longest duplicate window a store can choose: one week. */
export const MAX_DUPLICATE_WINDOW_HOURS = 7 * 24;

/**
 * `GET/PUT /orders/forms/limits` (#134): a store can make its forms stricter than the platform,
 * never looser. Lower rates and a longer duplicate window both mean fewer accepted orders.
 */
export const FormLimitsSchema = z.strictObject({
  perIpPerHour: z.number().int().min(1).max(FORM_LIMITS.perIpPerHour),
  perPhonePerHour: z.number().int().min(1).max(FORM_LIMITS.perPhonePerHour),
  duplicateWindowHours: z
    .number()
    .int()
    .min(FORM_LIMITS.duplicateWindowHours)
    .max(MAX_DUPLICATE_WINDOW_HOURS),
});
export type FormLimits = z.infer<typeof FormLimitsSchema>;

/** What a store gets until it saves its own limits. */
export const DEFAULT_FORM_LIMITS: FormLimits = {
  perIpPerHour: FORM_LIMITS.perIpPerHour,
  perPhonePerHour: FORM_LIMITS.perPhonePerHour,
  duplicateWindowHours: FORM_LIMITS.duplicateWindowHours,
};
