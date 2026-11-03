import { type PublicPickup, PublicPickupSchema } from '@trackecom/contracts';
import { apiBaseUrl } from '../api/api-base-url';

/** The partner shop holding the parcel and the code to give it (#202). */
export async function fetchPickup(code: string): Promise<PublicPickup['pickup']> {
  const url = `${apiBaseUrl}/public/tracking/${encodeURIComponent(code)}/pickup`;
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) return null;
  return PublicPickupSchema.parse(await response.json()).pickup;
}
