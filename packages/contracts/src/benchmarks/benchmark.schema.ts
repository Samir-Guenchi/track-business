import { z } from 'zod';

/**
 * Market benchmarks (#200): a store's delivery figures next to the same figures for the other
 * stores, per wilaya and per carrier to a wilaya. A market figure is published only when enough
 * other stores and parcels contribute, so it can never reveal one store's numbers.
 */
export const BENCHMARK_MIN_STORES = 5;
export const BENCHMARK_MIN_PARCELS = 50;

export const BenchmarkQuerySchema = z.strictObject({
  days: z.coerce.number().int().min(7).max(180).default(30),
});
export type BenchmarkQuery = z.infer<typeof BenchmarkQuerySchema>;

export const DeliveryFiguresSchema = z.strictObject({
  /** Delivered plus returned parcels: the ones with a final answer. */
  parcels: z.number().int().min(0),
  deliveryRate: z.number().min(0).max(1).nullable(),
  avgDeliveryDays: z.number().min(0).nullable(),
});
export type DeliveryFigures = z.infer<typeof DeliveryFiguresSchema>;

export const BenchmarkLineSchema = z.strictObject({
  wilayaCode: z.number().int().nullable(),
  /** Null on a wilaya line (all carriers together). */
  carrier: z.string().nullable(),
  own: DeliveryFiguresSchema.nullable(),
  /** The other stores together; null below the publishing threshold. */
  market: DeliveryFiguresSchema.nullable(),
});
export type BenchmarkLine = z.infer<typeof BenchmarkLineSchema>;

/** `GET /benchmarks`. */
export const BenchmarkResponseSchema = z.strictObject({
  days: z.number().int(),
  minStores: z.number().int(),
  minParcels: z.number().int(),
  wilayas: z.array(BenchmarkLineSchema),
  carriers: z.array(BenchmarkLineSchema),
});
export type BenchmarkResponse = z.infer<typeof BenchmarkResponseSchema>;
