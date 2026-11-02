import {
  type CreateDeliveryRequest,
  type DeliveryChoices,
  DeliveryChoicesSchema,
} from '@trackecom/contracts';
import { apiBaseUrl } from '../api/api-base-url';

export type ChoiceErrorKey = 'too_many' | 'closed' | 'bad_date' | 'not_offered' | 'generic';

export type ChoiceResult =
  | { readonly ok: true; readonly choices: DeliveryChoices }
  | { readonly ok: false; readonly error: ChoiceErrorKey };

const KNOWN: ReadonlySet<string> = new Set(['too_many', 'closed', 'bad_date', 'not_offered']);
const url = (code: string, path: string) =>
  `${apiBaseUrl}/public/tracking/${encodeURIComponent(code)}/${path}`;

/** Null when the parcel offers nothing or the call failed: the page then shows no choices. */
export async function fetchChoices(code: string): Promise<DeliveryChoices | null> {
  const response = await fetch(url(code, 'choices'), { cache: 'no-store' });
  if (!response.ok) return null;
  return DeliveryChoicesSchema.parse(await response.json());
}

export async function sendChoice(
  code: string,
  request: CreateDeliveryRequest,
): Promise<ChoiceResult> {
  const response = await fetch(url(code, 'requests'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (response.ok) return { ok: true, choices: DeliveryChoicesSchema.parse(await response.json()) };
  return { ok: false, error: await errorOf(response) };
}

async function errorOf(response: Response): Promise<ChoiceErrorKey> {
  const body = (await response.json().catch(() => null)) as { error?: { code?: string } } | null;
  const code = body?.error?.code?.replace(/^delivery_requests\./, '') ?? '';
  return KNOWN.has(code) ? (code as ChoiceErrorKey) : 'generic';
}
