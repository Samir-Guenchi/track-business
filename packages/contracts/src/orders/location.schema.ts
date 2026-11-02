import { z } from 'zod';

/**
 * A map pin for addresses without a street number (#135): "near the mosque", "cité 500 logements
 * bloc C". Kept inside Algeria's bounding box so a swapped lat/lng is refused at once.
 */
export const GeoPointSchema = z.strictObject({
  lat: z.number().min(18.9).max(37.2),
  lng: z.number().min(-8.7).max(12),
  /** Radius of the browser's estimate, in metres. */
  accuracyM: z.number().int().min(0).max(5000).optional(),
});
export type GeoPoint = z.infer<typeof GeoPointSchema>;

/** Who dropped the pin: the customer from their link, or an agent during the call. */
export const LocationSourceSchema = z.enum(['customer', 'agent']);
export type LocationSource = z.infer<typeof LocationSourceSchema>;

export const LocationPinSchema = z.strictObject({
  lat: z.number(),
  lng: z.number(),
  accuracyM: z.number().int().nullable(),
  source: LocationSourceSchema,
  setAt: z.iso.datetime(),
});
export type LocationPin = z.infer<typeof LocationPinSchema>;

/** "Behind the CEM", "facing the pharmacy": what the courier looks for. */
export const LandmarkSchema = z.string().trim().min(2).max(160);

/** A link any phone opens in its maps app; also what a label's QR code carries. */
export const mapLinkOf = (pin: { lat: number; lng: number }): string =>
  `https://www.google.com/maps?q=${pin.lat.toFixed(6)},${pin.lng.toFixed(6)}`;
