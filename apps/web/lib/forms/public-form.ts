import {
  FormKeySchema,
  ListWilayasResponseSchema,
  type PublicOrderForm,
  PublicOrderFormSchema,
  type Wilaya,
} from '@trackecom/contracts';
import { apiBaseUrl } from '../api/api-base-url';

/** Inside the cluster the server reaches the gateway without going through the internet. */
const serverApiUrl = process.env.API_INTERNAL_URL ?? apiBaseUrl;

/** The gateway caches forms 60 s; the page does the same so a busy ad stays cheap. */
const REVALIDATE_SECONDS = 60;

/** Null when the key is malformed, unknown or the form is switched off: the page answers 404. */
export async function fetchPublicForm(key: string): Promise<PublicOrderForm | null> {
  if (!FormKeySchema.safeParse(key).success) return null;
  const response = await fetch(`${serverApiUrl}/public/forms/${encodeURIComponent(key)}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`public form answered ${response.status}`);
  return PublicOrderFormSchema.parse(await response.json());
}

/** Reference data: cached for a day. */
export async function fetchWilayas(): Promise<Wilaya[]> {
  const response = await fetch(`${serverApiUrl}/geo/wilayas`, { next: { revalidate: 86_400 } });
  if (!response.ok) throw new Error(`geo answered ${response.status}`);
  return ListWilayasResponseSchema.parse(await response.json()).items;
}
