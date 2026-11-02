import { z } from 'zod';
import { WilayaCodeSchema } from './wilaya.schema.js';

/**
 * A carrier's stop-desk (#137): where the customer collects the parcel, as Mondial Relay or GLS
 * ParcelShop points are picked at checkout in France.
 */
export const StopDeskSchema = z.strictObject({
  id: z.uuid(),
  carrier: z.string(),
  name: z.string(),
  address: z.string(),
  wilayaCode: z.number().int(),
  communeId: z.number().int(),
  communeNameFr: z.string(),
  communeNameAr: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  /** Opening hours by day range, e.g. { "sat-thu": "08:00-17:00" }. */
  hours: z.record(z.string(), z.string()).nullable(),
  phone: z.string().nullable(),
  /** From the point asked for, in km; null without a point or without GPS for the desk. */
  distanceKm: z.number().nullable(),
});
export type StopDesk = z.infer<typeof StopDeskSchema>;

export const ListStopDesksQuerySchema = z
  .strictObject({
    wilayaCode: WilayaCodeSchema.optional(),
    communeId: z.coerce.number().int().positive().optional(),
    carrier: z.string().trim().min(1).max(40).optional(),
    lat: z.coerce.number().min(18.9).max(37.2).optional(),
    lng: z.coerce.number().min(-8.7).max(12).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(30),
  })
  .refine((query) => (query.lat === undefined) === (query.lng === undefined), {
    message: 'Give both lat and lng, or neither',
  })
  .refine((query) => query.wilayaCode ?? query.communeId ?? query.lat, {
    message: 'Give a wilaya, a commune or a point',
  });
export type ListStopDesksQuery = z.infer<typeof ListStopDesksQuerySchema>;

export const ListStopDesksResponseSchema = z.strictObject({ items: z.array(StopDeskSchema) });
export type ListStopDesksResponse = z.infer<typeof ListStopDesksResponseSchema>;

/** `POST /stop-desks/sync/:carrier`: the carrier's list, pulled with the store's credentials. */
export const SyncStopDesksResponseSchema = z.strictObject({
  carrier: z.string(),
  saved: z.number().int().min(0),
  /** Desks whose commune name matched no commune of their wilaya; left out until fixed. */
  unmatched: z.array(z.strictObject({ code: z.string(), communeName: z.string() })),
});
export type SyncStopDesksResponse = z.infer<typeof SyncStopDesksResponseSchema>;
