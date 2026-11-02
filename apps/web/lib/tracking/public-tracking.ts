import {
  PublicCodeSchema,
  type PublicTrackingResponse,
  PublicTrackingResponseSchema,
} from '@trackecom/contracts';
import { apiBaseUrl } from '../api/api-base-url';

/** Inside the cluster the server can reach the gateway without going through the internet. */
const serverApiUrl = process.env.API_INTERNAL_URL ?? apiBaseUrl;

/** The gateway caches the answer 60 s; the page does the same so a shared link stays cheap. */
const REVALIDATE_SECONDS = 60;

/** Null when the code is malformed or unknown: the page answers 404 without saying which. */
export async function fetchPublicTracking(code: string): Promise<PublicTrackingResponse | null> {
  if (!PublicCodeSchema.safeParse(code).success) return null;
  const response = await fetch(`${serverApiUrl}/public/tracking/${encodeURIComponent(code)}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`public tracking answered ${response.status}`);
  return PublicTrackingResponseSchema.parse(await response.json());
}
