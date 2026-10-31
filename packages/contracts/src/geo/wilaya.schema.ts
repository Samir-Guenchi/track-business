import { z } from 'zod';

/** Official wilaya number (1..69 since law 26-06 of 2026; reforms add codes through a new dataset version). */
export const WilayaCodeSchema = z.coerce.number().int().min(1).max(99);

export const WilayaSchema = z.strictObject({
  code: z.number().int(),
  nameAr: z.string().min(1),
  nameFr: z.string().min(1),
});

export type Wilaya = z.infer<typeof WilayaSchema>;

export const ListWilayasResponseSchema = z.strictObject({ items: z.array(WilayaSchema) });
export type ListWilayasResponse = z.infer<typeof ListWilayasResponseSchema>;
