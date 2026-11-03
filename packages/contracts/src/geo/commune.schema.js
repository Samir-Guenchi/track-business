import { z } from 'zod';
export const CommuneSchema = z.strictObject({
  id: z.number().int(),
  wilayaCode: z.number().int(),
  nameAr: z.string().min(1),
  nameFr: z.string().min(1),
  postalCode: z
    .string()
    .regex(/^\d{5}$/)
    .nullable(),
  hasStopDesk: z.boolean(),
});
export const ListCommunesResponseSchema = z.strictObject({ items: z.array(CommuneSchema) });
