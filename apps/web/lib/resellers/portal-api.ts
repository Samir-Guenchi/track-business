import {
  ApiErrorSchema,
  PortalCodeSchema,
  type ResellerOrderCreated,
  ResellerOrderCreatedSchema,
  type ResellerOrderRequest,
  type ResellerPortal,
  ResellerPortalSchema,
} from '@trackecom/contracts';
import { apiBaseUrl } from '../api/api-base-url';

const serverApiUrl = process.env.API_INTERNAL_URL ?? apiBaseUrl;
const path = (code: string) => `/public/resellers/${encodeURIComponent(code)}`;

/** Null when the code is malformed or unknown: the page answers 404. */
export async function fetchPortal(code: string): Promise<ResellerPortal | null> {
  if (!PortalCodeSchema.safeParse(code).success) return null;
  const response = await fetch(`${serverApiUrl}${path(code)}`, { cache: 'no-store' });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`reseller portal answered ${response.status}`);
  return ResellerPortalSchema.parse(await response.json());
}

export type SendResult =
  | { readonly ok: true; readonly created: ResellerOrderCreated }
  | { readonly ok: false; readonly code: string };

/** Sends the order from the browser; on refusal, the stable error code to explain it. */
export async function sendPortalOrder(
  code: string,
  body: ResellerOrderRequest,
): Promise<SendResult> {
  const response = await fetch(`${apiBaseUrl}${path(code)}/orders`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => null);
  if (!response) return { ok: false, code: 'network' };
  const json: unknown = await response.json().catch(() => null);
  if (response.ok) return { ok: true, created: ResellerOrderCreatedSchema.parse(json) };
  const error = ApiErrorSchema.safeParse(json);
  return { ok: false, code: error.success ? error.data.error.code : 'generic' };
}
